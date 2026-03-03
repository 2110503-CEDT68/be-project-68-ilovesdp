const Dentist = require('../models/Dentist');
const Appointment = require('../models/Appointment');

exports.getDentists = async (req,res,next) => {
    let query;

    // Copy req.query
    const reqQuery = {...req.query};

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);
    console.log(reqQuery);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    query = Dentist.find(JSON.parse(queryStr)).populate('appointments');

    // Select Fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;


    try {
        const total = await Dentist.countDocuments();
        query = query.skip(startIndex).limit(limit);
        // Executing query
        const dentists = await query;

        // Pagination result
        const pagination = {};

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }

        if (startIndex > 0) {
            pagination.previous = {
                page: page - 1,
                limit
            };
        }

        res.status(200).json({success:true, count:dentists.length, data:dentists});
    } catch (err) {
        res.status(400).json({success:false, msg:err.message});
    }
};

exports.getDentist = async (req,res,next) => {
    try {
        const dentist = await Dentist.findById(req.params.id);

        if (!dentist) {
            return res.status(400).json({success:false});
        }

        res.status(200).json({success:true, data:dentist});
    } catch (err) {
        res.status(400).json({success:false});
    }
};

exports.createDentist = async (req,res,next) => {
    try {
        const dentist = await Dentist.create(req.body);
        res.status(201).json({
            success:true, 
            data:dentist
        });
    } catch (err) {
        res.status(400).json({success:false, msg:err.message});
        console.log(err.stack);
    }
};

exports.updateDentist = async(req,res,next) => {
    try {
        const dentist = await Dentist.findByIdAndUpdate(req.params.id, req.body, {
            new:true,
            runValidators:true
        });

        if (!dentist) {
            return res.status(400).json({success:false});
        }

        res.status(200).json({success:true, data:dentist});
    } catch (err) {
        res.status(400).json({success:false});
    }
};

exports.deleteDentist = async (req,res,next) => {
    try {
        const dentist = await Dentist.findById(req.params.id);

        if (!dentist) {
            return res.status(404).json({success:false, message:`Dentist not found with id of ${req.params.id}`});
        }

        await Appointment.deleteMany({ dentist: req.params.id });
        await Dentist.deleteOne({ _id: req.params.id });
        
        res.status(200).json({success:true, data:{}});
    } catch (err) {
        res.status(400).json({success:false});
    }
}
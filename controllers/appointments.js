const Appointment = require('../models/Appointment');
const Hospital = require('../models/Hospital');

exports.getAppointments = async (req,res,next) => {
    // Build a single filter that supports nested hospital routes and role-based access.
    const filter = {};

    if (req.params.hospitalId) {
        filter.hospital = req.params.hospitalId;
    }

    // General user can only see their own appointments. Admin can see all appointments.
    if (req.user.role !== 'admin') {
        filter.user = req.user.id;
    }

    const query = Appointment.find(filter).lean();
    
    try {
        const appointments = await query;

        // Preserve the hospital id even when populate cannot resolve the document.
        const hospitalIds = new Map();
        appointments.forEach((appointment) => {
            hospitalIds.set(String(appointment._id), appointment.hospital);
        });

        await Appointment.populate(appointments, {
            path: 'hospital',
            select: 'name province tel'
        });

        // If populate fails (missing hospital), keep the original id in the hospital field.
        appointments.forEach((appointment) => {
            if (appointment.hospital === null) {
                appointment.hospital = hospitalIds.get(String(appointment._id));
            }
        });
        res.status(200).json({
            success:true,
            count:appointments.length,
            data:appointments
        });
    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({
            success:false, 
            message:"Can not find Appointment"
        });
    }
};

exports.getAppointment = async (req,res,next) => {
    try {
        const appointment = await Appointment.findById(req.params.id).populate({
            path: 'hospital',
            select: 'name province tel'
        });

        if (!appointment) {
            return res.status(404).json({
                success:false,
                message:`No Appointment with the id of ${req.params.id}`
            });
        }

        res.status(200).json({
            success:true,
            data:appointment
        });
    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({
            success:false, 
            message:"Can not find Appointment"
        });
    }
};

exports.addAppointment = async (req,res,next) => {
    try {
        req.body.hospital = req.params.hospitalId;

        const hospital = await Hospital.findById(req.params.hospitalId);

        if (!hospital) {
            return res.status(404).json({
                success:false,
                message:`No hospital with the id of ${req.params.hospitalId}`
            });
        }
        console.log(req.body);

        //add user to req.body
        req.body.user = req.user.id;
        const existingAppointment = await Appointment.find({user: req.user.id});
        if (existingAppointment.length >= 3 && req.user.role !== 'admin') {
            return res.status(400).json({
                success:false,
                message:`The user with ID ${req.user.id} has already made an appointment`
             });
         }

        const appointment = await Appointment.create(req.body);
        res.status(200).json({
            success:true,
            data:appointment
        });
    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({
            success:false, 
            message:"Cannot create Appointment"
        });
    }
};

exports.updateAppointment = async (req,res,next) => {
    try {
        let appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success:false,
                message:`No appt with id ${req.params.id}`
            });
        }

        if (appointment.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success:false,
                message:`User ${req.user.id} is not authorized to update this appointment`
            });
        }

        appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {new:true, runValidators:true});

        res.status(200).json({
            success:true,
            data:appointment
        });
    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({
            success:false, 
            message:"Cannot update Appointment"
        });
    }
};

exports.deleteAppointment = async (req,res,next) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success:false,
                message:`No appt with id ${req.params.id}`
            });
        }

        if (appointment.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success:false,
                message:`User ${req.user.id} is not authorized to delete this appointment`
            });
        }
        
        // Use deleteOne since document remove() is deprecated in newer Mongoose.
        await appointment.deleteOne();
        
        res.status(200).json({
            success:true,
            data:{}
        });
    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({
            success:false, 
            message:"Cannot delete Appointment"
        });
    }
};
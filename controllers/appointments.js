const Appointment = require('../models/Appointment');
const Dentist = require('../models/Dentist');

exports.getAppointments = async (req,res,next) => {
    // Build a single filter that supports nested dentist routes and role-based access.
    const filter = {};

    if (req.params.dentistId) {
        filter.dentist = req.params.dentistId;
    }

    // General user can only see their own appointments. Admin can see all appointments.
    if (req.user.role !== 'admin') {
        filter.user = req.user.id;
    }

    const query = Appointment.find(filter).lean();
    
    try {
        const appointments = await query;

        // Preserve the dentist id even when populate cannot resolve the document.
        const dentistIds = new Map();
        appointments.forEach((appointment) => {
            dentistIds.set(String(appointment._id), appointment.dentist);
        });

        await Appointment.populate(appointments, {
            path: 'dentist',
            select: 'name yearsOfExperience areaOfExpertise'
        });

        // If populate fails (missing dentist), keep the original id in the dentist field.
        appointments.forEach((appointment) => {
            if (appointment.dentist === null) {
                appointment.dentist = dentistIds.get(String(appointment._id));
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
            path: 'dentist',
            select: 'name yearsOfExperience areaOfExpertise'
        });

        if (!appointment) {
            return res.status(404).json({
                success:false,
                message:`No Appointment with the id of ${req.params.id}`
            });
        }

        // Check ownership: only the appointment owner or admin can view
        if (appointment.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success:false,
                message:`User ${req.user.id} is not authorized to view this appointment`
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
        req.body.dentist = req.params.dentistId;

        const dentist = await Dentist.findById(req.params.dentistId);

        if (!dentist) {
            return res.status(404).json({
                success:false,
                message:`No dentist with the id of ${req.params.dentistId}`
            });
        }
        console.log(req.body);

        //add user to req.body
        req.body.user = req.user.id;
        const existingAppointment = await Appointment.find({user: req.user.id});
        if (existingAppointment.length >= 1 && req.user.role !== 'admin') {
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
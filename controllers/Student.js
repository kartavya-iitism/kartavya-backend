const Student = require('../models/Student');
const User = require('../models/User');
const jwt = require('jsonwebtoken')

module.exports.addStudent = async (req, res, profilePictureUrl) => {
    try {
        const authorizedData = await jwt.verify(req.token, process.env.JWT_KEY);
        if (!authorizedData) {
            throw new Error("Unauthorized access to students' records");
        }
        const user = await User.findOne({ username: authorizedData.username });
        console.log(authorizedData)

        if (!user || user.role != "admin") {
            throw new Error("Unauthorized access to students' records");
        }
        const {
            serialNumber,
            name,
            fatherName,
            motherName,
            address,
            school,
            dateOfBirth
        } = req.body;
        const student = new Student({
            serialNumber,
            name,
            fatherName,
            motherName,
            address,
            school,
            dateOfBirth,
            profileImage: profilePictureUrl
        });
        await student.save();
        res.status(201).send(student);
    } catch (error) {
        if (req.containerClient && req.blobName) {
            try {
                const blockBlobClient = req.containerClient.getBlockBlobClient(req.blobName);
                await blockBlobClient.delete();
                console.log('Uploaded file deleted due to registration failure.');
            } catch (deleteError) {
                console.error('Failed to delete uploaded file:', deleteError);
            }
        }
        res.status(500).json({
            name: error.name,
            error: error.message
        })
    }
}


module.exports.editStudent = async (req, res) => {
    try {
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                res.status(403).json({
                    message: "protected Route"
                });
            } else {
                if (authorizedData) {
                    const user = await User.findById(authorizedData.username);
                    if (user.role !== "admin") {
                        res.status(403).json({ message: "Unauthorized access to sudents records" });
                    }
                } else {
                    res.status(401).json({ message: "Unauthorized access to students records" });
                }
            }
        });
        const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!student) {
            return res.status(404).send();
        }
        res.send(student);
    } catch (error) {
        res.status(400).send(error);
    }
}


module.exports.editStudentResult = async (req, res) => {
    try {
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                res.status(403).json({
                    message: "protected Route"
                });
            } else {
                if (authorizedData) {
                    const user = await User.findById(authorizedData.username);
                    if (user.role !== "admin") {
                        res.status(403).json({ message: "Unauthorized access to sudents records" });
                    }
                } else {
                    res.status(401).json({ message: "Unauthorized access to students records" });
                }
            }
        });
        const student = await Student.findOne({ _id: req.params.id });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        student.results.push(req.body);
        await student.save();
        res.send(student);
    } catch (error) {
        res.status(400).send(error);
    }
}


module.exports.editStudentSponsor = async (req, res) => {
    try {
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                res.status(403).json({
                    message: "protected Route"
                });
            } else {
                if (authorizedData) {
                    const user = await User.findById(authorizedData.username);
                    if (user.role !== "admin") {
                        res.status(403).json({ message: "Unauthorized access to sudents records" });
                    }
                } else {
                    res.status(401).json({ message: "Unauthorized access to students records" });
                }
            }
        });
        const student = await Student.findOne({ _id: req.params.id });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        student.sponsored = true;
        student.sponsor = req.body.sponsor;
        const sponsor = await User.findOne({ username: req.body.sponsor });
        sponsor.sponsoredStudents.push(student._id);
        await sponsor.save();
        await student.save();
        res.send(student);
    } catch (error) {
        res.status(400).send(error);
    }
}


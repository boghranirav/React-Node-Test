const MeetingHistory = require('../../model/schema/meeting')
const mongoose = require('mongoose');

const add = async (req, res) => {
    try {
        const meeting = new MeetingHistory(req.body);
        await meeting.save();
        res.status(200).json(meeting );
    } catch (error) {
        res.status(400).json({  message: 'Error adding meeting', error: error.message });
    }
}

const index = async (req, res) => {
    try {
            const query = req.query
            query.deleted = false;
    
            if (query.createBy) {
                query.createBy = new mongoose.Types.ObjectId(query.createBy);
            }
    
            const result = await MeetingHistory.aggregate([
                { $match: query },
                {
                    $lookup: {
                        from: 'User',
                        localField: 'createBy',
                        foreignField: '_id',
                        as: 'users'
                    }
                },
                {
                    $lookup: {
                        from: 'Contacts',
                        localField: 'attendes',
                        foreignField: '_id',
                        as: 'attendes'
                    }
                },
                // Lookup Leads for 'attendesLead'
                {
                    $lookup: {
                        from: 'Leads',
                        localField: 'attendesLead',
                        foreignField: '_id',
                        as: 'attendesLead'
                    }
                },
                { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
                { $match: { 'users.deleted': false } },
                {
                    $addFields: {
                        createdByName: '$users.username',
                    }
                },
                {
                    $project: {
                        users: 0
                    }
                },
            ]);
    
            res.status(200).json(result);
        } catch (err) {
            console.error('Failed :', err);
            res.status(400).json({ err, error: 'Failed ' });
        }
}

const view = async (req, res) => {
    try {
            let result = await MeetingHistory.aggregate([
                { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
                {
                    $lookup: {
                        from: 'User',
                        localField: 'createBy',
                        foreignField: '_id',
                        as: 'users'
                    }
                },
                { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
                { $match: { 'users.deleted': false } },
                {
                    $addFields: {
                        createdByName: '$users.username',
                    }
                },
                {
                    $project: {
                        users: 0
                    }
                },
            ]);
    
            if (!result.length) {
                return res.status(404).json({ message: "No Data Found." });
            }
    
            res.status(200).json(result[0]);
        } catch (err) {
            console.error('Failed :', err);
            res.status(400).json({ err, error: 'Failed ' });
        }
}

const deleteData = async (req, res) => {
  try {
          const result = await MeetingHistory.findByIdAndUpdate(req.params.id, { deleted: true });
          res.status(200).json({ message: "done", result: result })
      } catch (err) {
          res.status(404).json({ message: "error", err })
      }
}

const deleteMany = async (req, res) => {
    try {
            const result = await MeetingHistory.updateMany({ _id: { $in: req.body } }, { $set: { deleted: true } });
            
            if (result?.matchedCount > 0 && result?.modifiedCount > 0) {
                return res.status(200).json({ message: "Meeting Removed successfully", result });
            }
            else {
                return res.status(404).json({ success: false, message: "Failed to remove meeting" })
            }
        } catch (err) {
            res.status(404).json({ message: "error", err })
        }
}

module.exports = { add, index, view, deleteData, deleteMany }
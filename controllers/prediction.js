const Prediction = require('../models/prediction');
const { cloudinary } = require('../config/cloudinary');

const uploadImage = async (file) => {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: 'predictions',
    transformation: { width: 500, height: 500, crop: 'fill' }
  });
  return result.secure_url;
};

const parseDateString = (dateStr) => {
  const [day, month, year] = dateStr.split('-');
  return new Date(year, month - 1, day);
};

const checkVIPAccess = (user) => {
  if (!user) {
    const error = new Error('Authentication required for VIP predictions');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isVip) {
    const error = new Error('VIP subscription required for these predictions');
    error.statusCode = 403;
    throw error;
  }

  const currentDate = new Date();
  if (user.expires && new Date(user.expires) < currentDate) {
    const error = new Error('Your VIP subscription has expired. Please renew to access VIP predictions');
    error.statusCode = 403;
    throw error;
  }

  return true;
};

const validateFormations = (formationA, formationB) => {
  if (!Array.isArray(formationA) || formationA.length !== 5) {
    throw new Error('Formation A must contain exactly 5 recent results');
  }
  if (!Array.isArray(formationB) || formationB.length !== 5) {
    throw new Error('Formation B must contain exactly 5 recent results');
  }
  return true;
};

exports.createPrediction = async (req, res) => {
  try {
    const {
      formationA,
      formationB,
      tip,
      league,
      teamA,
      teamB,
      country,
      teamAscore,
      teamBscore,
      sport,
      category,
      time,
      status,
      showScore,
      showBtn
    } = req.body;


    validateFormations(formationA, formationB);


    const leagueImage = await uploadImage(req.files['leagueImage'][0]);
    const teamAImage = await uploadImage(req.files['teamAImage'][0]);
    const teamBImage = await uploadImage(req.files['teamBImage'][0]);

    const prediction = await Prediction.create({
      formationA,
      formationB,
      leagueImage,
      teamAImage,
      teamBImage,
      tip,
      league,
      teamA,
      teamB,
      country,
      teamAscore,
      teamBscore,
      sport,
      category,
      time: new Date(time),
      status,
      showScore,
      showBtn
    });

    res.status(200).json({
      message: 'Prediction created successfully',
      status: 'success',
      data: prediction
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getPredictions = async (req, res) => {
  try {
    const { category, date } = req.params;

    if (!date || !category) {
      return res.status(400).json({
        status: 'error',
        message: 'Both date and category parameters are required'
      });
    }

    if (category === 'vip') {
      try {
        checkVIPAccess(req.user);
      } catch (error) {
        return res.status(error.statusCode || 500).json({
          status: 'error',
          message: error.message
        });
      }
    }

    // Handle both YYYY-MM-DD and DD-MM-YYYY formats
    let parsedDate;
    if (date.includes('-')) {
      const parts = date.split('-');
      if (parts[0].length === 4) {
        // YYYY-MM-DD format
        parsedDate = new Date(date);
      } else {
        // DD-MM-YYYY format
        parsedDate = parseDateString(date);
      }
    }

    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid date format. Please use YYYY-MM-DD or DD-MM-YYYY format'
      });
    }

    const startDate = new Date(parsedDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(parsedDate);
    endDate.setHours(23, 59, 59, 999);

    const query = {
      category,
      time: {
        $gte: startDate,
        $lte: endDate
      }
    };

    const predictions = await Prediction.find(query);

    res.status(200).json({
      status: 'success',
      message: predictions.length ? 'Predictions fetched successfully' : 'No predictions found for the given date',
      data: predictions
    });
  } catch (error) {
    console.error('Error in getPredictions:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
exports.getSinglePrediction = async (req, res) => {
  try {
    const { category, teamA, teamB, date } = req.params;

    if (!date || !teamA || !teamB || !category) {
      return res.status(400).json({
        status: 'error',
        message: 'All parameters (category, teamA, teamB, date) are required'
      });
    }

    if (category === 'vip') {
      try {
        checkVIPAccess(req.user);
      } catch (error) {
        return res.status(error.statusCode || 500).json({
          status: 'error',
          message: error.message
        });
      }
    }

    let parsedDate;
    if (date.includes('-')) {
      const parts = date.split('-');
      if (parts[0].length === 4) {
        parsedDate = new Date(date);
      } else {
        parsedDate = parseDateString(date);
      }
    }

    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid date format. Please use YYYY-MM-DD or DD-MM-YYYY format'
      });
    }

    const startDate = new Date(parsedDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(parsedDate);
    endDate.setHours(23, 59, 59, 999);

    const decodedTeamA = decodeURIComponent(teamA).trim();
    const decodedTeamB = decodeURIComponent(teamB).trim();

    const prediction = await Prediction.findOne({
      category,
      $or: [
        {
          teamA: { $regex: decodedTeamA, $options: 'i' },
          teamB: { $regex: decodedTeamB, $options: 'i' }
        },
        {
          teamA: { $regex: decodedTeamB, $options: 'i' },
          teamB: { $regex: decodedTeamA, $options: 'i' }
        }
      ],
      time: {
        $gte: startDate,
        $lte: endDate
      }
    });

    if (!prediction) {
      return res.status(404).json({
        status: 'error',
        message: 'No prediction found matching the criteria'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Prediction fetched successfully',
      data: prediction
    });
  } catch (error) {
    console.error('Error in getSinglePrediction:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
exports.updatePrediction = async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id);
    if (!prediction) {
      return res.status(404).json({
        status: 'error',
        message: 'Prediction not found'
      });
    }

    const updateData = { ...req.body };

    if (updateData.formationA || updateData.formationB) {
      validateFormations(
        updateData.formationA || prediction.formationA,
        updateData.formationB || prediction.formationB
      );
    }

    if (updateData.time) {
      updateData.time = new Date(updateData.time);
    }

    if (req.files) {
      if (req.files['leagueImage']) {
        updateData.leagueImage = await uploadImage(req.files['leagueImage'][0]);
      }
      if (req.files['teamAImage']) {
        updateData.teamAImage = await uploadImage(req.files['teamAImage'][0]);
      }
      if (req.files['teamBImage']) {
        updateData.teamBImage = await uploadImage(req.files['teamBImage'][0]);
      }
    }

    const updatedPrediction = await Prediction.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Prediction updated successfully',
      status: 'success',
      data: updatedPrediction
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.deletePrediction = async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id);
    if (!prediction) {
      return res.status(404).json({
        message: 'Prediction not found',
        status: 'error'
      });
    }

    await Prediction.findByIdAndDelete(req.params.id);
    res.status(200).json({
      message: 'Prediction deleted successfully',
      status: 'success'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      status: 'error'
    });
  }
};

module.exports = exports;
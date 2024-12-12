const Donation = require('../models/Donation');  
const User = require('../models/User'); 

module.exports.donate = async (req, res) => {
    try {
        const { username, amount, date, typeOfDonation } = req.body;

        if (!username || !amount || !date || !typeOfDonation) {
            return res.status(400).json({ error: 'All fields are required' });
        }
 
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('User found:', user);

        const donation = new Donation({
            amount,
            date,
            name: user.name,
            mobileNumber: user.contactNumber,
            user: user._id,
            typeOfDonation,
        });

        const savedDonation = await donation.save();

        user.donations.push(savedDonation._id); 

        await user.save();

        console.log('Updated user:', user);

        res.status(201).json({ message: 'Donation made successfully', donation: savedDonation });

    } catch (error) {
        console.error('Error making donation:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
};

module.exports.viewSingleDonation = async (req, res) => {
    try {
      const donationId = req.params.donationId;

      const donation = await Donation.findById(donationId).populate('user', 'name email username');  // Populate user data if necessary
  
      if (!donation) {
        return res.status(404).json({ message: 'Donation not found' });
      }

      return res.status(200).json({ donation });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  };

  module.exports.viewAllDonations = async (req, res) => {
    try {
        const donations = await Donation.find().populate('user', 'name email username'); // Populate user data if necessary

        if (!donations || donations.length === 0) {
            return res.status(404).json({ message: 'No donations found' });
        }

        return res.status(200).json({ donations });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};
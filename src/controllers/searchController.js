const Internship = require('../models/Internship');

/**
 * @desc    Search internships with filters
 * @route   GET /api/search
 * @access  Public
 */
exports.searchInternships = async (req, res) => {
    try {
        const { 
            query, 
            location, 
            domain, 
            workEnvironment, 
            minGpa, 
            page = 1, 
            limit = 10 
        } = req.query;

        const filter = { isDeleted: false, status: 'Hiring' };

        // Text search
        if (query) {
            filter.$text = { $search: query };
        }

        // Exact filters
        if (location) filter.location = { $regex: location, $options: 'i' };
        if (domain) filter.domain = domain;
        if (workEnvironment) filter.workEnvironment = workEnvironment;
        if (minGpa) filter.minimumGPA = { $lte: parseFloat(minGpa) };

        const skip = (page - 1) * limit;

        const internships = await Internship.find(filter)
            .sort(query ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('employer', 'name companyName profilePicture');

        const total = await Internship.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: internships.length,
            total,
            pages: Math.ceil(total / limit),
            data: internships
        });
    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const logger = require('../utils/logger');
const Student = require('../models/Student');
const User = require('../models/User');
const Internship = require('../models/Internship');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const normalizePreferredLocation = (preferredLocation, fallback = []) => {
  if (Array.isArray(preferredLocation)) {
    return preferredLocation.filter(Boolean);
  }

  if (typeof preferredLocation === 'string' && preferredLocation.trim()) {
    return [preferredLocation.trim()];
  }

  return Array.isArray(fallback) ? fallback : [];
};

const calculateAgeFromDate = (dateValue) => {
  const dob = new Date(dateValue);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age;
};

const normalizeProjectTechnologies = (technologies) => {
  if (Array.isArray(technologies)) {
    return technologies.map((tech) => String(tech || '').trim()).filter(Boolean);
  }

  if (typeof technologies === 'string' && technologies.trim()) {
    return technologies
      .split(',')
      .map((tech) => tech.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeProjectUrl = (value = '') => {
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const mapProjectScreenshotUpload = (file) => ({
  fileName: file.originalname || file.filename,
  filePath: String(file.path || '').replace(/\\/g, '/'),
  publicId: file.filename,
  mimeType: file.mimetype,
  fileSize: file.size,
  uploadedAt: new Date(),
});

const deleteCloudinaryImages = async (files = []) => {
  const imageFiles = Array.isArray(files)
    ? files.filter((file) => file?.publicId)
    : [];

  if (imageFiles.length === 0) return;

  await Promise.allSettled(
    imageFiles.map((file) => cloudinary.uploader.destroy(file.publicId, { resource_type: 'image' }))
  );
};

const parseScreenshotIds = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  const trimmed = value.trim();

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item || '').trim()).filter(Boolean);
    }
  } catch (error) {
    // Fallback to comma-separated values.
  }

  return trimmed
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

// @desc    Get student profile
// @route   GET /api/student/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ userId: req.user.id }).populate('userId');

  if (!student) {
    return res.status(200).json({
      success: true,
      data: null,
      message: 'No student profile found',
    });
  }

  res.status(200).json({
    success: true,
    data: student,
  });
});

// @desc    Create or get student profile
// @route   POST /api/student/profile/init
// @access  Private
exports.initializeProfile = asyncHandler(async (req, res, next) => {
  let student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    student = await Student.create({
      userId: req.user.id,
    });
  }

  res.status(201).json({
    success: true,
    data: student,
  });
});

// @desc    Save personal information
// @route   POST /api/student/profile/personal
// @access  Private
exports.savePersonalInfo = asyncHandler(async (req, res, next) => {
  const {
    fullName,
    email,
    phone,
    about,
    designation,
    location, 
    age,
    country,
    dateOfBirth, 
    gender,
    // CRITICAL MATCHING ENGINE FIELDS
    gpa,
    portfolioUrl,
    portfolio,
    preferredLocation,
    durationPreference,
    industriesOfInterest,
    previousInternshipsCount,
    isPublic,
    seniority
  } = req.body;

  // Validation
  if (!fullName || !email) {
    return next(
      new ErrorResponse(
        'Full name and email are required',
        400
      )
    );
  }

  let parsedDateOfBirth = null;
  if (dateOfBirth) {
    parsedDateOfBirth = new Date(dateOfBirth);
    if (Number.isNaN(parsedDateOfBirth.getTime())) {
      return next(new ErrorResponse('Invalid date of birth', 400));
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (parsedDateOfBirth > today) {
      return next(new ErrorResponse('Date of birth cannot be in the future', 400));
    }
  }

  const computedAge = parsedDateOfBirth ? calculateAgeFromDate(parsedDateOfBirth) : null;

  let student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    student = await Student.create({
      userId: req.user.id,
    });
  }

  const hasGpa = Object.prototype.hasOwnProperty.call(req.body, 'gpa');

  // Update personal info with all new fields
  student.personalInfo = {
    ...(student.personalInfo || {}), // Preserve existing data
    fullName: fullName.trim(),
    designation: designation?.trim() || '',
    email: email.toLowerCase().trim(),
    phone: phone?.trim() || '',
    about: typeof about === 'string' ? about.trim().slice(0, 200) : (student.personalInfo?.about || ''),
    country: country?.trim() || student.personalInfo?.country || '',
    location: location?.trim() || '',
    age: computedAge !== null
      ? computedAge
      : (age === '' || age === null || age === undefined ? student.personalInfo?.age : Number(age)),
    dateOfBirth: parsedDateOfBirth || student.personalInfo?.dateOfBirth,
    gender: gender || student.personalInfo?.gender,
    // CRITICAL MATCHING ENGINE FIELDS
    gpa: hasGpa ? String(gpa ?? '').trim() : (student.personalInfo?.gpa || ''),
    portfolioUrl: portfolioUrl?.trim() || student.personalInfo?.portfolioUrl || '',
    preferredLocation: normalizePreferredLocation(preferredLocation, student.personalInfo?.preferredLocation),
    durationPreference: durationPreference || student.personalInfo?.durationPreference,
    industriesOfInterest: Array.isArray(industriesOfInterest) ? industriesOfInterest : (student.personalInfo?.industriesOfInterest || []),
    previousInternshipsCount: typeof previousInternshipsCount === 'number' ? previousInternshipsCount : (student.personalInfo?.previousInternshipsCount || 0),
    isPublic: typeof isPublic === 'boolean' ? isPublic : (student.personalInfo?.isPublic !== false),
    seniority: Array.isArray(seniority)
      ? seniority.filter(Boolean)
      : (typeof seniority === 'string' && seniority.trim()
        ? [seniority.trim()]
        : (student.personalInfo?.seniority || ['Student'])),
  };

  student.seniority = student.personalInfo.seniority;

  // Update portfolio if provided. Explicit empty strings should clear existing values.
  if (portfolio && typeof portfolio === 'object') {
    const hasGithub = Object.prototype.hasOwnProperty.call(portfolio, 'github');
    const hasLinkedin = Object.prototype.hasOwnProperty.call(portfolio, 'linkedin');
    const hasWebsite = Object.prototype.hasOwnProperty.call(portfolio, 'website');
    const hasPortfolio = Object.prototype.hasOwnProperty.call(portfolio, 'portfolio');

    student.portfolio = {
      github: hasGithub
        ? String(portfolio.github || '').trim()
        : (student.portfolio?.github || ''),
      linkedin: hasLinkedin
        ? String(portfolio.linkedin || '').trim()
        : (student.portfolio?.linkedin || ''),
      website: hasWebsite
        ? String(portfolio.website || '').trim()
        : (student.portfolio?.website || ''),
      portfolio: hasPortfolio
        ? String(portfolio.portfolio || '').trim()
        : (student.portfolio?.portfolio || student.personalInfo?.portfolioUrl || ''),
    };
  }

  // Update user email if different
  if (email && email !== req.user.email) {
    const user = await User.findById(req.user.id);
    user.email = email.toLowerCase().trim();
    await user.save();
  }

  // Calculate profile completion
  student.calculateProfileCompletion();
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Personal information saved successfully',
    data: student,
  });
});

// @desc    Save education details
// @route   POST /api/student/profile/education
// @access  Private
exports.saveEducation = asyncHandler(async (req, res, next) => {
  try {
    const { institution, degree, field, degreeLevel, durationMonths, startDate, endDate, isCurrentlyStudying } = req.body;
    
    logger.info('Education request data:', { institution, degree, field, degreeLevel, durationMonths, startDate, endDate });

    // Validation
    if (!institution || !degree || !field || !startDate) {
      return next(
        new ErrorResponse(
          'Institution, degree, field, and start date are required',
          400
        )
      );
    }

  // Validate dates
  if (isNaN(new Date(startDate).getTime())) {
    return next(
      new ErrorResponse(
        'Invalid start date format',
        400
      )
    );
  }

  if (endDate && isNaN(new Date(endDate).getTime())) {
    return next(
      new ErrorResponse(
        'Invalid end date format',
        400
      )
    );
  }

  // Validate degree level if provided
  const validDegreeLevels = ['HIGH_SCHOOL', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'DOCTORATE', 'CERTIFICATE'];
  if (degreeLevel && !validDegreeLevels.includes(degreeLevel)) {
    return next(
      new ErrorResponse(
        'Invalid degree level. Must be: HIGH_SCHOOL, ASSOCIATE, BACHELOR, MASTER, DOCTORATE, or CERTIFICATE',
        400
      )
    );
  }

  if (durationMonths !== undefined && durationMonths !== null && durationMonths !== '') {
    const parsedDuration = Number(durationMonths);
    if (Number.isNaN(parsedDuration) || parsedDuration <= 0) {
      return next(
        new ErrorResponse(
          'Invalid durationMonths. It must be a positive number of months',
          400
        )
      );
    }
  }

  let student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    student = await Student.create({
      userId: req.user.id,
    });
  }

    // Create education entry with safe date conversion
    const newEducation = {
      institution: institution.trim(),
      degree: degree.trim(),
      field: field.trim(),
      startDate: new Date(startDate),
      endDate: endDate && endDate.trim() ? new Date(endDate) : null,
      isCurrentlyStudying: isCurrentlyStudying || false,
    };

    // Add degreeLevel if provided
    if (degreeLevel) {
      newEducation.degreeLevel = degreeLevel;
    }

    if (durationMonths !== undefined && durationMonths !== null && durationMonths !== '') {
      newEducation.durationMonths = Number(durationMonths);
    }

    logger.info('Processed education:', newEducation);

    // Check if education entry already exists
    const existingIndex = student.education.findIndex(
      (edu) => edu.institution === institution && edu.degree === degree
    );

    if (existingIndex !== -1) {
      student.education[existingIndex] = { ...student.education[existingIndex], ...newEducation };
    } else {
      student.education.push(newEducation);
    }

    // Calculate profile completion
    student.calculateProfileCompletion();
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Education details saved successfully',
      data: student,
    });
  } catch (error) {
    logger.error('Education save error:', error);
    return next(new ErrorResponse(`Failed to save education: ${error.message}`, 500));
  }
});

// @desc    Update education entry
// @route   PUT /api/student/profile/education/:educationId
// @access  Private
exports.updateEducation = asyncHandler(async (req, res, next) => {
  try {
    const { educationId } = req.params;
    const { institution, degree, field, degreeLevel, durationMonths, startDate, endDate, isCurrentlyStudying } = req.body;

    logger.info('Education update request data:', { educationId, institution, degree, field, degreeLevel, durationMonths, startDate, endDate });

    if (!institution || !degree || !field || !startDate) {
      return next(
        new ErrorResponse(
          'Institution, degree, field, and start date are required',
          400
        )
      );
    }

    if (isNaN(new Date(startDate).getTime())) {
      return next(new ErrorResponse('Invalid start date format', 400));
    }

    if (endDate && isNaN(new Date(endDate).getTime())) {
      return next(new ErrorResponse('Invalid end date format', 400));
    }

    const validDegreeLevels = ['HIGH_SCHOOL', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'DOCTORATE', 'CERTIFICATE'];
    if (degreeLevel && !validDegreeLevels.includes(degreeLevel)) {
      return next(
        new ErrorResponse(
          'Invalid degree level. Must be: HIGH_SCHOOL, ASSOCIATE, BACHELOR, MASTER, DOCTORATE, or CERTIFICATE',
          400
        )
      );
    }

    if (durationMonths !== undefined && durationMonths !== null && durationMonths !== '') {
      const parsedDuration = Number(durationMonths);
      if (Number.isNaN(parsedDuration) || parsedDuration <= 0) {
        return next(
          new ErrorResponse(
            'Invalid durationMonths. It must be a positive number of months',
            400
          )
        );
      }
    }

    const student = await Student.findOne({ userId: req.user.id });

    if (!student) {
      return next(new ErrorResponse('Student profile not found', 404));
    }

    const educationEntry = student.education.id(educationId);

    if (!educationEntry) {
      return next(new ErrorResponse('Education entry not found', 404));
    }

    educationEntry.institution = institution.trim();
    educationEntry.degree = degree.trim();
    educationEntry.field = field.trim();
    educationEntry.startDate = new Date(startDate);
    educationEntry.endDate = endDate && endDate.trim() ? new Date(endDate) : null;
    educationEntry.isCurrentlyStudying = isCurrentlyStudying || false;

    if (degreeLevel) {
      educationEntry.degreeLevel = degreeLevel;
    } else {
      educationEntry.degreeLevel = undefined;
    }

    if (durationMonths !== undefined && durationMonths !== null && durationMonths !== '') {
      educationEntry.durationMonths = Number(durationMonths);
    } else {
      educationEntry.durationMonths = undefined;
    }

    student.calculateProfileCompletion();
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Education details updated successfully',
      data: student,
    });
  } catch (error) {
    logger.error('Education update error:', error);
    return next(new ErrorResponse(`Failed to update education: ${error.message}`, 500));
  }
});

// @desc    Save school
// @route   POST /api/student/profile/school
// @access  Private
exports.saveSchool = asyncHandler(async (req, res, next) => {
  try {
    const { school } = req.body;

    logger.info('School request data:', { school });

    // Validation
    if (!school || !school.trim()) {
      return next(
        new ErrorResponse('School name is required', 400)
      );
    }

    let student = await Student.findOne({ userId: req.user.id });

    if (!student) {
      student = await Student.create({
        userId: req.user.id,
      });
    }

    // Create school entry
    const newSchool = {
      school: school.trim(),
    };

    logger.info('Processed school:', newSchool);

    // Check if school already exists
    const existingIndex = student.schools.findIndex(
      (s) => s.school.toLowerCase() === school.trim().toLowerCase()
    );

    if (existingIndex === -1) {
      student.schools.push(newSchool);
    } else {
      logger.info('School already exists, skipping duplicate');
    }

    // Calculate profile completion
    student.calculateProfileCompletion();
    await student.save();

    res.status(200).json({
      success: true,
      message: 'School saved successfully',
      data: student,
    });
  } catch (error) {
    logger.error('School save error:', error);
    return next(new ErrorResponse(`Failed to save school: ${error.message}`, 500));
  }
});

// @desc    Update school
// @route   PUT /api/student/profile/school/:schoolId
// @access  Private
exports.updateSchool = asyncHandler(async (req, res, next) => {
  const { schoolId } = req.params;
  const { school } = req.body;

  if (!school || !school.trim()) {
    return next(new ErrorResponse('School name is required', 400));
  }

  const student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    return next(new ErrorResponse('Student profile not found', 404));
  }

  const schoolEntry = student.schools.id(schoolId);

  if (!schoolEntry) {
    return next(new ErrorResponse('School entry not found', 404));
  }

  const normalizedSchool = school.trim();
  const duplicateSchool = student.schools.find(
    (s) => s._id.toString() !== schoolId && s.school.toLowerCase() === normalizedSchool.toLowerCase()
  );

  if (duplicateSchool) {
    return next(new ErrorResponse('School already exists', 400));
  }

  schoolEntry.school = normalizedSchool;

  student.calculateProfileCompletion();
  await student.save();

  res.status(200).json({
    success: true,
    message: 'School updated successfully',
    data: student,
  });
});

// @desc    Add or update skill
// @route   POST /api/student/profile/skill
// @access  Private
exports.addSkill = asyncHandler(async (req, res, next) => {
  const { name, proficiency } = req.body;

  // Validation
  if (!name) {
    return next(new ErrorResponse('Skill name is required', 400));
  }

  // Set default proficiency if not provided or invalid
  const validProficiencies = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
  const skillProficiency = validProficiencies.includes(proficiency) ? proficiency : 'INTERMEDIATE';

  let student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    student = await Student.create({
      userId: req.user.id,
    });
  }

  // Check if skill already exists
  const existingSkill = student.skills.find(
    (skill) => skill.name.toLowerCase() === name.toLowerCase()
  );

  if (existingSkill) {
    existingSkill.proficiency = skillProficiency;
  } else {
    student.skills.push({
      name: name.trim(),
      proficiency: skillProficiency,
    });
  }

  // Calculate profile completion
  student.calculateProfileCompletion();
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Skill added successfully',
    data: student,
  });
});

// @desc    Remove skill
// @route   DELETE /api/student/profile/skill/:skillId
// @access  Private
exports.removeSkill = asyncHandler(async (req, res, next) => {
  const { skillId } = req.params;

  const student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    return next(new ErrorResponse('Student profile not found', 404));
  }

  student.skills = student.skills.filter((skill) => skill._id.toString() !== skillId);

  // Calculate profile completion
  student.calculateProfileCompletion();
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Skill removed successfully',
    data: student,
  });
});

// @desc    Add project
// @route   POST /api/student/profile/project
// @access  Private
exports.saveProject = asyncHandler(async (req, res, next) => {
  const { title, description, technologies, repositoryUrl, liveUrl } = req.body;

  if (!title || !title.trim()) {
    return next(new ErrorResponse('Project title is required', 400));
  }

  let student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    student = await Student.create({
      userId: req.user.id,
    });
  }

  const normalizedTitle = title.trim();
  const duplicateProject = student.projects.find(
    (project) => project.title.toLowerCase() === normalizedTitle.toLowerCase()
  );

  if (duplicateProject) {
    return next(new ErrorResponse('Project with this title already exists', 400));
  }

  const uploadedScreenshots = Array.isArray(req.files)
    ? req.files.map(mapProjectScreenshotUpload)
    : [];

  if (uploadedScreenshots.length > 10) {
    return next(new ErrorResponse('You can upload up to 10 project screenshots', 400));
  }

  student.projects.push({
    title: normalizedTitle,
    description: description ? String(description).trim() : '',
    technologies: normalizeProjectTechnologies(technologies),
    repositoryUrl: normalizeProjectUrl(repositoryUrl),
    liveUrl: normalizeProjectUrl(liveUrl),
    screenshots: uploadedScreenshots,
  });

  student.calculateProfileCompletion();
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Project added successfully',
    data: student,
  });
});

// @desc    Update project
// @route   PUT /api/student/profile/project/:projectId
// @access  Private
exports.updateProject = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const { title, description, technologies, repositoryUrl, liveUrl, removeScreenshotIds } = req.body;

  if (!title || !title.trim()) {
    return next(new ErrorResponse('Project title is required', 400));
  }

  const student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    return next(new ErrorResponse('Student profile not found', 404));
  }

  const projectEntry = student.projects.id(projectId);

  if (!projectEntry) {
    return next(new ErrorResponse('Project not found', 404));
  }

  const normalizedTitle = title.trim();
  const duplicateProject = student.projects.find(
    (project) =>
      project._id.toString() !== projectId &&
      project.title.toLowerCase() === normalizedTitle.toLowerCase()
  );

  if (duplicateProject) {
    return next(new ErrorResponse('Project with this title already exists', 400));
  }

  const existingScreenshots = Array.isArray(projectEntry.screenshots)
    ? projectEntry.screenshots
    : [];
  const screenshotIdsToRemove = parseScreenshotIds(removeScreenshotIds);
  const screenshotsToDelete = existingScreenshots.filter((shot) =>
    screenshotIdsToRemove.includes(shot._id.toString())
  );
  const screenshotsToKeep = existingScreenshots.filter(
    (shot) => !screenshotIdsToRemove.includes(shot._id.toString())
  );
  const uploadedScreenshots = Array.isArray(req.files)
    ? req.files.map(mapProjectScreenshotUpload)
    : [];

  if (screenshotsToKeep.length + uploadedScreenshots.length > 10) {
    return next(new ErrorResponse('You can upload up to 10 project screenshots per project', 400));
  }

  await deleteCloudinaryImages(screenshotsToDelete);

  projectEntry.title = normalizedTitle;
  projectEntry.description = description ? String(description).trim() : '';
  projectEntry.technologies = normalizeProjectTechnologies(technologies);
  projectEntry.repositoryUrl = normalizeProjectUrl(repositoryUrl);
  projectEntry.liveUrl = normalizeProjectUrl(liveUrl);
  projectEntry.screenshots = [...screenshotsToKeep, ...uploadedScreenshots];

  student.calculateProfileCompletion();
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: student,
  });
});

// @desc    Remove project
// @route   DELETE /api/student/profile/project/:projectId
// @access  Private
exports.removeProject = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;

  const student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    return next(new ErrorResponse('Student profile not found', 404));
  }

  const projectToRemove = student.projects.id(projectId);

  if (!projectToRemove) {
    return next(new ErrorResponse('Project not found', 404));
  }

  await deleteCloudinaryImages(projectToRemove.screenshots || []);

  student.projects = student.projects.filter(
    (project) => project._id.toString() !== projectId
  );

  student.calculateProfileCompletion();
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Project removed successfully',
    data: student,
  });
});

// @desc    Get all skills
// @route   GET /api/student/profile/skills
// @access  Private
exports.getSkills = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    return res.status(200).json({
      success: true,
      data: [],
    });
  }

  res.status(200).json({
    success: true,
    data: student.skills,
  });
});

// @desc    Get education history
// @route   GET /api/student/profile/education
// @access  Private
exports.getEducation = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    return res.status(200).json({
      success: true,
      data: [],
    });
  }

  res.status(200).json({
    success: true,
    data: student.education,
  });
});

// @desc    Delete education entry
// @route   DELETE /api/student/profile/education/:educationId
// @access  Private
exports.removeEducation = asyncHandler(async (req, res, next) => {
  const { educationId } = req.params;

  const student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    return next(new ErrorResponse('Student profile not found', 404));
  }

  student.education = student.education.filter(
    (edu) => edu._id.toString() !== educationId
  );

  // Calculate profile completion
  student.calculateProfileCompletion();
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Education entry removed successfully',
    data: student,
  });
});

// @desc    Remove school
// @route   DELETE /api/student/profile/school/:schoolId
// @access  Private
exports.removeSchool = asyncHandler(async (req, res, next) => {
  const { schoolId } = req.params;

  const student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    return next(new ErrorResponse('Student profile not found', 404));
  }

  student.schools = student.schools.filter(
    (school) => school._id.toString() !== schoolId
  );

  // Calculate profile completion
  student.calculateProfileCompletion();
  await student.save();

  res.status(200).json({
    success: true,
    message: 'School entry removed successfully',
    data: student,
  });
});

// @desc    Update portfolio links
// @route   POST /api/student/profile/portfolio
// @access  Private
exports.updatePortfolio = asyncHandler(async (req, res, next) => {
  const { github, linkedin, website, portfolio } = req.body;

  let student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    student = await Student.create({
      userId: req.user.id,
    });
  }

  student.portfolio = {
    github: github?.trim() || '',
    linkedin: linkedin?.trim() || '',
    website: website?.trim() || '',
    portfolio: portfolio?.trim() || '',
  };

  // Calculate profile completion
  student.calculateProfileCompletion();
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Portfolio links updated successfully',
    data: student,
  });
});

// @desc    Get profile completion status
// @route   GET /api/student/profile/completion
// @access  Private
exports.getProfileCompletion = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    return res.status(200).json({
      success: true,
      data: {
        personal: 0,
        education: 0,
        skills: 0,
        overall: 0,
      },
    });
  }

  res.status(200).json({
    success: true,
    data: student.profileCompletion,
  });
});

// @desc    Upload profile image
// @route   POST /api/student/profile/image
// @access  Private
exports.uploadProfileImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Please upload an image file', 400));
  }

  let student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    student = await Student.create({
      userId: req.user.id,
    });
  }

  logger.info(`Profile image upload for user ${req.user.id}: ${req.file.path}`);


  // Update profile image
  const profilePicturePath = req.file.path.replace(/\\/g, '/'); // Normalize path for cross-platform
  student.profileImage = {
    fileName: req.file.filename,
    filePath: profilePicturePath,
    uploadedAt: new Date(),
  };

  // Sync with User model
  await User.findByIdAndUpdate(req.user.id, {
    profilePicture: profilePicturePath
  });

  // Calculate profile completion
  student.calculateProfileCompletion();
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Profile image uploaded successfully',
    data: {
      student: student,
      filePath: req.file.path,
    },
  });
});

// @desc    Add certification
// @route   POST /api/student/profile/certification
// @access  Private
exports.addCertification = asyncHandler(async (req, res, next) => {
  const { name, credentialUrl, issuedDate } = req.body;

  // Validation
  if (!name || !issuedDate) {
    return next(
      new ErrorResponse(
        'Certification name and issued date are required',
        400
      )
    );
  }

  let student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    student = await Student.create({
      userId: req.user.id,
    });
  }

  // Check if certification already exists
  const existingCert = student.certifications.find(
    (cert) => cert.name.toLowerCase() === name.toLowerCase()
  );

  if (existingCert) {
    return next(
      new ErrorResponse(
        'Certification with this name already exists',
        400
      )
    );
  }

  // Add new certification
  student.certifications.push({
    name: name.trim(),
    credentialUrl: credentialUrl?.trim() || '',
    issuedDate: new Date(issuedDate),
  });

  // Calculate profile completion
  student.calculateProfileCompletion();
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Certification added successfully',
    data: student,
  });
});

// @desc    Update certification
// @route   PUT /api/student/profile/certification/:certificationId
// @access  Private
exports.updateCertification = asyncHandler(async (req, res, next) => {
  const { certificationId } = req.params;
  const { name, credentialUrl, issuedDate } = req.body;

  if (!name || !issuedDate) {
    return next(
      new ErrorResponse(
        'Certification name and issued date are required',
        400
      )
    );
  }

  const student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    return next(new ErrorResponse('Student profile not found', 404));
  }

  const certToUpdate = student.certifications.id(certificationId);

  if (!certToUpdate) {
    return next(new ErrorResponse('Certification not found', 404));
  }

  const duplicateCert = student.certifications.find(
    (cert) =>
      cert._id.toString() !== certificationId &&
      cert.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicateCert) {
    return next(
      new ErrorResponse(
        'Certification with this name already exists',
        400
      )
    );
  }

  certToUpdate.name = name.trim();
  certToUpdate.credentialUrl = credentialUrl?.trim() || '';
  certToUpdate.issuedDate = new Date(issuedDate);

  student.calculateProfileCompletion();
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Certification updated successfully',
    data: student,
  });
});

// @desc    Remove certification
// @route   DELETE /api/student/profile/certification/:certificationId
// @access  Private
exports.removeCertification = asyncHandler(async (req, res, next) => {
  const { certificationId } = req.params;

  let student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    return next(new ErrorResponse('Student profile not found', 404));
  }

  // Find and remove certification
  const certIndex = student.certifications.findIndex(
    (cert) => cert._id.toString() === certificationId
  );

  if (certIndex === -1) {
    return next(new ErrorResponse('Certification not found', 404));
  }

  student.certifications.splice(certIndex, 1);

  // Calculate profile completion
  student.calculateProfileCompletion();
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Certification removed successfully',
    data: student,
  });
});

// @desc    Upload certificate file (separate from online certifications)
// @route   POST /api/student/profile/certificate-file
// @access  Private
exports.uploadCertificateFile = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Please upload a certificate file', 400));
  }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return next(new ErrorResponse('Please upload a valid certificate file (PDF, JPG, PNG, GIF, WEBP)', 400));
  }

  let student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    student = await Student.create({ userId: req.user.id });
  }

  const filePath = req.file.path.replace(/\\/g, '/');
  const title = req.body?.title ? String(req.body.title).trim() : '';

  student.uploadedCertificates.push({
    title,
    fileName: req.file.originalname || req.file.filename,
    filePath,
    publicId: req.file.filename,
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
    uploadedAt: new Date(),
  });

  await student.save();

  res.status(200).json({
    success: true,
    message: 'Certificate file uploaded successfully',
    data: student,
  });
});

// @desc    Remove uploaded certificate file
// @route   DELETE /api/student/profile/certificate-file/:fileId
// @access  Private
exports.removeUploadedCertificate = asyncHandler(async (req, res, next) => {
  const { fileId } = req.params;

  const student = await Student.findOne({ userId: req.user.id });
  if (!student) {
    return next(new ErrorResponse('Student profile not found', 404));
  }

  const fileIndex = student.uploadedCertificates.findIndex(
    (file) => file._id.toString() === fileId
  );

  if (fileIndex === -1) {
    return next(new ErrorResponse('Uploaded certificate file not found', 404));
  }

  const fileToRemove = student.uploadedCertificates[fileIndex];

  if (fileToRemove?.publicId) {
    try {
      const resourceType = fileToRemove?.mimeType?.startsWith('image/') ? 'image' : 'raw';
      await cloudinary.uploader.destroy(fileToRemove.publicId, { resource_type: resourceType });
    } catch (cloudinaryError) {
      logger.error(`Failed to delete certificate file from Cloudinary: ${fileToRemove.publicId}`, cloudinaryError);
    }
  }

  student.uploadedCertificates.splice(fileIndex, 1);
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Uploaded certificate file removed successfully',
    data: student,
  });
});

// @desc    Upload resume
// @route   POST /api/student/profile/resume
// @access  Private
exports.uploadResume = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Please upload a resume file', 400));
  }

  // Validate file type
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return next(new ErrorResponse('Please upload a valid resume file (PDF, DOC, DOCX)', 400));
  }

  let student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    student = await Student.create({
      userId: req.user.id,
    });
  }

  // Update resume
  const resumePath = req.file.path.replace(/\\/g, '/');
  student.resume = {
    fileName: req.file.filename,
    filePath: resumePath,
    uploadedAt: new Date(),
  };

  // Calculate profile completion
  student.calculateProfileCompletion();
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Resume uploaded successfully',
    data: {
      student: student,
      filePath: req.file.path,
    },
  });
});

// @desc    Delete resume
// @route   DELETE /api/student/profile/resume
// @access  Private
exports.deleteResume = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    return next(new ErrorResponse('Student profile not found', 404));
  }

  student.resume = {};

  // Recalculate profile completion after removing resume
  student.calculateProfileCompletion();
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Resume deleted successfully',
    data: {
      student
    }
  });
});

// @desc    Reset/Delete all profile data
// @route   DELETE /api/student/profile/reset
// @access  Private
exports.resetProfile = asyncHandler(async (req, res, next) => {
  let student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    return res.status(200).json({
      success: true,
      message: 'No profile data found to reset',
    });
  }

  await deleteCloudinaryImages(
    student.projects?.flatMap((project) => project.screenshots || []) || []
  );

  // Clear all profile data
  student.personalInfo = {};
  student.education = [];
  student.skills = [];
  student.projects = [];
  student.certifications = [];
  student.uploadedCertificates = [];
  student.profileImage = {};
  student.coverImage = {};
  student.resume = {};
  student.portfolio = {};
  student.profileCompletion = {
    personal: 0,
    education: 0,
    skills: 0,
    overall: 0,
  };
  student.status = 'incomplete';

  await student.save();

  res.status(200).json({
    success: true,
    message: 'Profile data reset successfully',
    data: student,
  });
});

// @desc    Upload cover image
// @route   POST /api/student/profile/cover
// @access  Private
exports.uploadCoverImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Please upload an image file', 400));
  }

  let student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    student = await Student.create({
      userId: req.user.id,
    });
  }

  // Update cover image
  const coverImagePath = req.file.path.replace(/\\/g, '/');
  student.coverImage = {
    fileName: req.file.filename,
    filePath: coverImagePath,
    uploadedAt: new Date(),
  };

  logger.info(`Cover image upload for user ${req.user.id}: ${req.file.path}`);

  // Calculate profile completion
  student.calculateProfileCompletion();
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Cover image uploaded successfully',
    data: {
      student: student,
      filePath: req.file.path,
    },
  });
});

// @desc    Get user's saved/bookmarked internships
// @route   GET /api/students/bookmarks
// @access  Private (Student)
exports.getSavedInternships = async (req, res) => {
    try {
        const student = await User.findById(req.user.id).populate('savedInternships');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        res.status(200).json({
            success: true,
            count: student.savedInternships.length,
            data: student.savedInternships
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Bookmark an internship
// @route   POST /api/students/bookmarks/:id
// @access  Private (Student)
exports.bookmarkInternship = async (req, res) => {
    try {
        const internshipId = req.params.id;
        const internship = await Internship.findById(internshipId);

        if (!internship) {
            return res.status(404).json({ success: false, message: 'Internship not found' });
        }

        // Add to savedInternships if not already present
        const student = await User.findByIdAndUpdate(
            req.user.id,
            { $addToSet: { savedInternships: internshipId } },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Internship bookmarked successfully',
            data: student.savedInternships
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Remove an internship from bookmarks
// @route   DELETE /api/students/bookmarks/:id
// @access  Private (Student)
exports.unbookmarkInternship = async (req, res) => {
    try {
        const internshipId = req.params.id;

        // Remove from savedInternships
        const student = await User.findByIdAndUpdate(
            req.user.id,
            { $pull: { savedInternships: internshipId } },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Internship removed from bookmarks',
            data: student.savedInternships
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


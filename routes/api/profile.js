const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const {check, validationResult} = require('express-validator');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const request = require('request');
const config = require('config');

//@route    GET api/profile/me
//desc      get current user's profile
//access    Private

router.get('/me', auth, async (req, res) => { 
    try{
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

        if(!profile) {
            return res.status(400).json({ msg: 'User does not exists'});
        }
        res.json(profile);
    }catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    } 
});

//@route    POST api/profile
//desc      Create or update user profile
//access    Private

router.post('/', [auth,
    [
        check('status', 'Status is required').not().isEmpty(),
        check('skills', 'skill is required').not().isEmpty()
    ]
],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const {company, website, location, bio, status, githubusername,
        skills, youtube, facebook, instagram, twitter, linkedin} = req.body;

    //Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if(company) profileFields.company = company;
    if(website) profileFields.website = website;
    if(location) profileFields.location = location;
    if(bio) profileFields.bio = bio;
    if(status) profileFields.status = status;
    if(githubusername) profileFields.githubusername = githubusername;
    if(skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    console.log(profileFields.skills);

    //Build social object
    profileFields.social = {};
    if(youtube) profileFields.social.youtube = youtube;
    if(facebook) profileFields.social.facebook = facebook;
    if(instagram) profileFields.social.instagram = instagram;
    if(twitter) profileFields.social.twitter = twitter;
    if(linkedin) profileFields.social.linkedin = linkedin;

    try {
        let profile = await Profile.findOne({ user: req.user.id });

        if(profile) {
            //Update
            profile = await Profile.findOneAndUpdate( { user: req.user.id}, { $set: profileFields }, {new: true});

            return res.json(profile);
        }

        //Create Profile
        profile = new Profile(profileFields);
        await profile.save();
        res.json(profile);

    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

//@route    GET api/profile
//desc      get all profiles
//access    Public

router.get('/', async (req,res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route    GET api/profile/user/:user_id
//desc      get profile with user id
//access    Public

router.get('/user/:user_id', async (req,res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id}).populate('user', ['name', 'avatar']);
        
        if(!profile) return res.status(400).json({ msg: 'Profile not found'});
        
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        
        if(err.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'Profile not found'});
        }
        
        res.status(500).send('Server Error');
    }
});

//@route    DELETE api/profile
//desc      delete user, profile and post
//access    Public

router.delete('/', auth, async (req,res) => {
    try {
        // Delete User's profile
        await Profile.findOneAndRemove({ user: req.user.id});
        
        //Delete User
        await User.findOneAndRemove({ _id: req.user.id});

        res.json({msg: 'User Deleted'});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route    PUT api/profile/experience
//desc      Addd Profile Experience
//access    Public

router.put('/experience', [auth, 
    check('title', 'title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'from date is required').not().isEmpty()
], 
async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {title, company, location, from, to, current, description} = req.body;

    const newExp = {title, company, location, from, to, current, description };

    try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.experience.unshift(newExp);

        await profile.save();
        
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
})

//@route    DELETE api/profile/experience/:exp_id
//desc      delete experience from profile
//access    Public
router.delete('/experience/:exp_id', auth, async (req,res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //get remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        
        profile.experience.splice(removeIndex, 1);
    
        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route    PUT api/profile/education
//desc      Addd Profile Education
//access    Public

router.put('/education', [auth, 
    check('school', 'School is required').not().isEmpty(),
    check('degree', 'Degree is required').not().isEmpty(),
    check('fieldOfStudy', 'Feild of study is required').not().isEmpty(),
    check('from', 'from date is required').not().isEmpty()
], 
async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {school, degree, fieldOfStudy, from, to, current, description} = req.body;

    const newEdu = {school, degree, fieldOfStudy, from, to, current, description };

    try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.education.unshift(newEdu);

        await profile.save();
        
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
})

//@route    DELETE api/profile/education/:edu_id
//desc      delete education from profile
//access    Public
router.delete('/education/:edu_id', auth, async (req,res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //get remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
        
        profile.education.splice(removeIndex, 1);
    
        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route    GET api/github/:username
//desc      get repos of user
//access    Public
router.get('/github/:username', (req,res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&
                  client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: {'user-agent': 'node.js'}
        };

        request(options, (error, response, body) => {
            if(error) console.error(error);

            if(response.statusCode !== 200) {
                return res.status(404).json({ msg: 'No github profile found' });
            }

            res.json(JSON.parse(body));
        })
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

module.exports = router;
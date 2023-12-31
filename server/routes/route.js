const express = require("express");
const { register, signin, about, changePasswordcontrol, changeProfileDataControl } = require("../controller/auth");
const router = express.Router()
const path = require('path');
const authenticate = require("../middleware/authenticate");
const profilePicUpload = require("../controller/profilePicUpload");
const User = require("../models/userSchema");
const posterUpload = require("../controller/posterUpload");
const postUploadControl = require("../controller/postUploadControl");
const Post = require("../models/postSchema");

const multer = require('multer');
const PostImgesUpload = require("../controller/PostImgesUpload");
const { findFriends, followUser } = require("../controller/friendsController");
const feedController = require("../controller/feedController");
const { notificationControll, notificationControllTrue } = require("../controller/NotificationController");


router.post("/register", register);
router.post("/signin", signin);
router.post('/uploadPost', authenticate, postUploadControl);

router.get("/about", authenticate, (req, res) => {
  res.send(req.rootUser)
})



router.get('/showprofilecode', authenticate, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.id }).sort({ createdAt: -1 });
    res.send(posts)
  } catch (error) {
    console.error('Error uploading code snippet', error);
    res.status(500).json({ message: 'An error occurred while uploading the code snippet' });
  }
});

router.delete('/account/deletepost/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    // Use the `findByIdAndRemove` method to delete the post by its ID
    const deletedPost = await Post.findByIdAndRemove(postId);

    if (!deletedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    return res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// router.post('/upload', upload.single('image'), (req, res) => {
//   const imagePath = req.file.path;

//   res.json({ imagePath });
// });

router.post('/uploadprofilepic', authenticate, profilePicUpload, async (req, res) => {
  const imagePath = req.file.path;
  const fileName = path.basename(imagePath);

  const id = req.rootUser._id
  const userSearch = await User.findById({ _id: id })
  try {
    userSearch.profile_pic = fileName;

    const userSaved = await userSearch.save()

    if (userSaved) {
      res.status(200).json({ messege: "Sucess" })
    } else {
      res.status(400).json({ messege: "Faild" })
    }
  } catch (err) {
    res.json(err)
  }
});

router.post('/uploadposter', authenticate, posterUpload, async (req, res) => {
  const imagePath = req.file.path;
  const fileName = path.basename(imagePath);

  const id = req.rootUser._id
  const userSearch = await User.findById({ _id: id })

  try {
    userSearch.poster_pic = fileName;

    const userSaved = await userSearch.save()

    if (userSaved) {
      res.status(200).json({ messege: "Sucess" })
    } else {
      res.status(400).json({ messege: "Faild" })
    }

  } catch (err) {
    res.json(err)
  }
});

router.post("/logout", async (req, res) => {
  res.clearCookie('jwtoken'); // Clear the JWT token cookie
  res.status(200).json({ message: 'Logout successful' });
})

router.post("/singlepost", async (req, res) => {
  try {
    const id = req.body.paramId
    const response = await Post.findById({ _id: id })
    res.status(200).send(response)
  } catch (err) {
    res.status(500).json({ message: err })
  }
})

router.post("/changeprofiledata", authenticate, changeProfileDataControl)
router.post("/changepassword", authenticate, changePasswordcontrol)
router.post('/postupload', authenticate, PostImgesUpload, postUploadControl);
router.get('/users-not-followed', authenticate, findFriends)
router.get("/feed", authenticate, feedController)
router.post("/followuser", authenticate, followUser)
router.get("/notification", authenticate, notificationControll)
router.post("/notificationread", authenticate, notificationControllTrue);

router.get("/userdataprofile/:userId", async (req, res) => {
  const userId = req.params.userId

  const user = await User.findById(userId);
  console.log(user)
  res.status(200).json({ user })
})

router.get("/userposteddata/:userId", async (req, res) => {
  const userId = req.params.userId

  const posteddata = await Post.find({ author: userId }).sort({ createdAt: -1 });;
  // console.log(user)
  res.status(200).send(posteddata)
})

router.post("/likePost", authenticate, async (req, res) => {
  const PostId = req.body.id;
  const userId = req.id

  try {
    const PostFind = await Post.findById(PostId)
    const userLiked = PostFind.likes.some(like => like.user.toString() == userId);

    if (userLiked) {
      PostFind.likes = PostFind.likes.filter(like => like.user.toString() != userId);
    } else {
      PostFind.likes.push({ user: userId });
    }

    const Savedlike = await PostFind.save()

    if (Savedlike) {
      res.status(200).json({ messege: "Success" })
    } else {
      res.status(401).json({ messege: "SomeThing Went Wrong" })
    }

  } catch (err) {
    res.status(400).json({ messege: "SomeThing Went Wrong" })
  }
})

router.post("/addcomment", authenticate, async (req, res) => {
  const content = req.body.CommentValue
  const id = req.body.id
  const user = req.rootUser._id
  const username = req.rootUser.name
  const profile_pic = req.rootUser.profile_pic

  try {
    const findPost = await Post.findById(id)
    findPost.comments.push({ user, content, username, profile_pic })

    const savedComments = await findPost.save();

    if (savedComments) {
      res.status(200).json("success")
    } else {
      res.status(401).json('error')
    }
  } catch (err) {
    res.status(400).json(`Error is ${err}`)
  }
})


module.exports = router
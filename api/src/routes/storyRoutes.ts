
import express from 'express';
import { createStory, getStories, toggleLike, getStoryLikes } from '../controllers/storyController';
import { upload } from '../config/multer';

const router = express.Router();

// Public: Get active stories
router.get('/', getStories);

// Protected: Upload story
router.post('/', upload.single('image'), createStory);

// Protected: Like actions
router.post('/:id/like', toggleLike);
router.get('/:id/likes', getStoryLikes);

export default router;

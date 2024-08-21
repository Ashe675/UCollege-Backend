import { Router } from "express";
import ConversationController from "../../controllers/chat/conversationController";
import { authenticate, authorizeRole } from "../../middleware/auth/auth";
import RequestContactController from "../../controllers/chat/requestContactController";
import { acceptAndDeclineRequestValidator, conversationIdValidator, createContactRequestValidator } from "../../validators/chat/requestValidator";
import MessageController from "../../controllers/chat/messageController";
import { conversationExists } from "../../middleware/chat/chatMiddlewares";
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router()

//* CHATS
router.get('/', 
    authenticate,
    ConversationController.getConversations
)


router.post('/new', 
    authenticate, 
    ConversationController.createConversation
)


//* FRIENDREQUESTS
router.post('/request', 
    authenticate,
    createContactRequestValidator,
    RequestContactController.createRequest
)

router.get('/request', 
    authenticate,
    RequestContactController.getRequests
)

router.post('/request/accept/:requestId', 
    authenticate,
    acceptAndDeclineRequestValidator,
    RequestContactController.acceptFriendRequest
)

router.post('/request/decline/:requestId', 
    authenticate,
    acceptAndDeclineRequestValidator,
    RequestContactController.declineFriendRequest
)

router.get('/contacts', 
    authenticate,
    RequestContactController.getContacts
)

//* MESSAGES

router.get('/:conversationId/messages',
    authenticate,
    conversationIdValidator,
    conversationExists,
    MessageController.getMessages
)

router.post('/:conversationId/messages',
    authenticate,
    conversationIdValidator,
    conversationExists,
    upload.single('file'),
    MessageController.createMessage
)


export default router
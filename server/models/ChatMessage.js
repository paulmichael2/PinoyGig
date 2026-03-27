import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
    gig: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gig',
        required: true,
        index: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        default: '',
        trim: true,
        maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    attachment: {
        name: {
            type: String,
            trim: true,
            maxlength: [255, 'Attachment name cannot exceed 255 characters'],
        },
        url: {
            type: String,
            trim: true,
        },
        mimeType: {
            type: String,
            trim: true,
        },
        size: {
            type: Number,
            min: [0, 'Attachment size must be positive'],
        },
        kind: {
            type: String,
            enum: ['image', 'file'],
        },
    },
    unsent: {
        type: Boolean,
        default: false,
    },
    unsentAt: {
        type: Date,
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }, ],
}, {
    timestamps: true,
});

chatMessageSchema.index({ gig: 1, createdAt: 1 });

chatMessageSchema.pre('validate', function() {
    if (this.unsent) {
        return;
    }

    const hasContent = Boolean(this.content && this.content.trim());
    const hasAttachment = Boolean(this.attachment && this.attachment.url);

    if (!hasContent && !hasAttachment) {
        this.invalidate('content', 'Message content or attachment is required');
    }
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
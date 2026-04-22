import Chat from "../models/Chat.js";

export const saveChat = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Login required" });
    }

    const { title, messages } = req.body;

    const chat = new Chat({
      userId,
      title,
      messages,
    });

    await chat.save();

    res.status(201).json({
      message: "Chat saved",
      chat,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getChats = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Login required" });
    }

    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });

    res.status(200).json({ chats });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateChat = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Login required" });
    }

    const { chatId, messages, title } = req.body;

    const chat = await Chat.findOne({ _id: chatId, userId });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    chat.messages = messages;
    chat.title = title || chat.title;

    await chat.save();

    res.status(200).json({
      message: "Chat updated",
      chat,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { chatId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Login required" });
    }

    const chat = await Chat.findOneAndDelete({
      _id: chatId,
      userId,
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json({ message: "Chat deleted" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const renameChat = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { chatId, title } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Login required" });
    }

    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, userId },
      { title },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json({ chat });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
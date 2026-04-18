import User from "../models/Auth.js";

export const addUser = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                message: "Username is required"
            });
        }

        const newUser = await User.create({
            name: username
        });

        return res.status(201).json({
            message: "User created successfully",
            data: newUser
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

export const getUsers = async (req, res) => {
    try {
        const users = await User.find();

        return res.status(200).json({
            data: users
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json(user);

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                message: "Username is required"
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name: username },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            message: "User updated",
            data: user
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};
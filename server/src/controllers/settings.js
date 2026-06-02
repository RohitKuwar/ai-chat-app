import Settings from '../models/Settings.js';

export const getSettings = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    let settings = await Settings.findOne({ userId });

    if (!settings) {
      settings = await Settings.create({
        userId,
      });
    }

    res.status(200).json({
      settings,
    });
  } catch (error) {
    console.error('Get settings error:', error);

    res.status(500).json({
      message: 'Failed to fetch settings',
    });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const { voiceURI, voiceName, voiceLang, theme, model, temperature } = req.body;

    const settings = await Settings.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...(voiceURI !== undefined && {
            voiceURI,
          }),

          ...(voiceName !== undefined && {
            voiceName,
          }),

          ...(voiceLang !== undefined && {
            voiceLang,
          }),

          ...(theme !== undefined && {
            theme,
          }),

          ...(model !== undefined && {
            model,
          }),

          ...(temperature !== undefined && {
            temperature,
          }),
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    res.status(200).json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Update settings error:', error);

    res.status(500).json({
      message: 'Failed to update settings',
    });
  }
};

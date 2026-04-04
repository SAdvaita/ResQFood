export const volunteerControllerPlaceholder = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Volunteer module placeholder",
    data: null,
    error: null
  });
};

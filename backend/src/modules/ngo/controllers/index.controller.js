export const ngoControllerPlaceholder = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "NGO module placeholder",
    data: null,
    error: null
  });
};

export const customerControllerPlaceholder = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Customer module placeholder",
    data: null,
    error: null
  });
};

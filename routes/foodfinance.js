// Add balance for food finance
router.post('/AddBalance', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req);
    if (!currentUsername) return res.status(401).json({ message: 'Unauthorized' });

    const { amount } = req.body;
    const user = await Student.findOne({ username: currentUsername });
    if (!user) return res.status(404).json({ message: 'کاربر یافت نشد' });

    let finance = await Finance.findOne({ userId: user._id });
    if (!finance) finance = new Finance({ userId: user._id, balance: 0 });

    finance.balance += Number(amount);
    await finance.save();

    res.json({ message: 'موجودی افزایش یافت', balance: finance.balance });
  } catch (err) {
    res.status(500).json({ message: 'خطا در افزایش موجودی', error: err.message });
  }
});

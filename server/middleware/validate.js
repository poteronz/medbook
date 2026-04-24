const { body, validationResult } = require("express-validator");

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  return next();
};

const registerRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Имя обязательно")
    .isLength({ min: 2, max: 100 }).withMessage("Имя должно содержать от 2 до 100 символов")
    .matches(/^[^<>]*$/).withMessage("Имя содержит недопустимые символы"),
  body("email")
    .trim()
    .isEmail().withMessage("Некорректный email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 }).withMessage("Пароль должен содержать минимум 6 символов"),
  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9+\-()\s]+$/).withMessage("Телефон содержит недопустимые символы"),
];

const loginRules = [
  body("email")
    .trim()
    .isEmail().withMessage("Некорректный email")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Пароль обязателен"),
];

const appointmentRules = [
  body("doctor_id")
    .isInt({ min: 1 }).withMessage("Некорректный ID врача"),
  body("slot_id")
    .isInt({ min: 1 }).withMessage("Некорректный ID слота"),
];

module.exports = {
  handleValidation,
  registerRules,
  loginRules,
  appointmentRules,
};

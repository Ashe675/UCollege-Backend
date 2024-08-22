
import { body, param  } from 'express-validator';
import handleInputErrors from '../../middleware/HandleInputError';

export const createContactRequestValidator = [
  body('receiverIdentificationCode')
    .notEmpty().withMessage('receiverIdentificationCode is required')
    .isNumeric().withMessage('Invalid receiverIdentificationCode'),
  handleInputErrors,
];

export const acceptAndDeclineRequestValidator = [
    param('requestId')
      .notEmpty().withMessage('requestId is required')
      .isNumeric().withMessage('Invalid requestId'),
    handleInputErrors,
  ];

  export const conversationIdValidator = [
    param('conversationId')
    .notEmpty().withMessage('conversationId is required'),
  handleInputErrors,
  ]
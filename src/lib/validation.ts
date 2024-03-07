import { body, validationResult } from 'express-validator';
import slugify from 'slugify';
import { Request, Response, NextFunction } from 'express';
import { getTeamBySlug } from './db.js'; 
import xss from 'xss';

export function validationCheck(req: Request, res: Response, next: NextFunction) {
  const validation = validationResult(req);
  if (!validation.isEmpty()) {
    return res.status(400).json({ errors: validation.array() });
  }
  return next();
}


export function atLeastOneBodyValueValidator(fields: string[]) {
  return body().custom((value, { req }) => {
    const reqBody = req.body;
    const valid = fields.some(field => field in reqBody && reqBody[field] != null);
    if (!valid) {
      throw new Error(`At least one of the following fields is required: ${fields.join(', ')}`);
    }
    return true;
  });
}


export const xssSanitizer = (param: string) =>
  body(param).customSanitizer((v) => xss(v));


export const xssSanitizerMany = (params: string[]) =>
  params.map(param => xssSanitizer(param));


export const genericSanitizer = (param: string) =>
  body(param).trim().escape();


export const genericSanitizerMany = (params: string[]) =>
  params.map(param => genericSanitizer(param));


export const stringValidator = ({
  field = '',
  required = true,
  maxLength = 0,
  optional = false,
} = {}) => {
  let validator = body(field).trim().isString().withMessage(`${field} must be a string`);

  if (required) {
    validator = validator.isLength({ min: 1 }).withMessage(`${field} is required`);
  }

  if (maxLength > 0) {
    validator = validator.isLength({ max: maxLength }).withMessage(`${field} must be no more than ${maxLength} characters long`);
  }

  if (optional) {
    validator = validator.optional({ nullable: true });
  }

  return validator;
};

export const teamValidationRules = {
  createOrUpdate: [
    body('name')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Name is required')
      .custom(value => {
        if (!value) {
          throw new Error('Empty name is not allowed');
        }
        return true;
      })
      .custom(async name => {
        const slug = slugify(name);
        const team = await getTeamBySlug(slug);
        if (team) {
          return Promise.reject('Team with this name already exists');
        }
      }),
    body('description').optional().trim(),
  ],
  slug: [
    body('slug').custom(value => {
      if (!value) {
        throw new Error('Slug is required');
      }
      return true;
    })
  ],
};

export const teamSlugDoesNotExistValidator = body('name').custom(async (name, { req }) => {
  const slug = slugify(name);
  const teamExists = await getTeamBySlug(slug);
  if (teamExists) {
    throw new Error('Team with this name already exists');
  }
});

export const gameValidationRules = {
  createOrUpdate: [
    body('date')
      .trim()
      .isISO8601()
      .withMessage('Invalid date format, should be ISO 8601'),
    body('homename')
      .isInt({ min: 1 })
      .withMessage('Home team ID must be a positive integer'),
    body('awayname')
      .isInt({ min: 1 })
      .withMessage('Away team ID must be a positive integer')
      .custom((value, { req }) => {
        if (value === req.body.home) {
          throw new Error('Home and away teams cannot be the same');
        }
        return true;
      }),
    body('homescore')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Home score must be a non-negative integer'),
    body('awayscore')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Away score must be a non-negative integer'),
  ]
};

export const createTeamValidations = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  ...teamValidationRules.createOrUpdate,
  teamSlugDoesNotExistValidator,
  xssSanitizerMany(['name', 'description']),
  validationCheck,
];

export const updateTeamValidations = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  ...teamValidationRules.createOrUpdate,
  teamSlugDoesNotExistValidator,
  xssSanitizerMany(['name', 'description']),
  validationCheck,
];

export const createGameValidations = [
  ...gameValidationRules.createOrUpdate, 
  validationCheck 
];


export const updateGameValidations = [
  ...gameValidationRules.createOrUpdate, 
  validationCheck 
];

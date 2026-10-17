import env from '../config/env.js';

const error = (description) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
});

const bearer = [{ bearerAuth: [] }];

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'College Review System API',
    version: '1.0.0',
    description: [
      'REST API for managing colleges and user reviews with JWT authentication and role-based access control.',
      '',
      '**Transport:** every `/api/*` route uses **POST** with a JSON body. See the README for the current path list (`/api/colleges/list`, `/api/colleges/get`, and so on). This document may still describe older GET/PATCH paths until it is fully regenerated.',
      '',
      '## Roles and permissions',
      '- **Admin**: create, update, and delete colleges; read all reviews; update or delete any review; list users and change roles.',
      '- **Teacher**: read colleges and reviews; create, update, and delete only their own reviews.',
      '- **Student**: same review permissions as Teacher. Cannot manage colleges or users.',
      '- Public registration can create **teacher** or **student** accounts only. The initial Admin is created by the seed script.',
      '',
      '## College uniqueness',
      'A college is unique by normalized name and location (trimmed, case-insensitive). The same name in a different location is allowed.',
      '',
      '## Review uniqueness',
      'A user may create only one review per college. Subsequent attempts return 409.',
      '',
      '## Rating aggregation',
      'College list and detail responses include `averageRating` (rounded to two decimals) and `reviewCount`, calculated from Review documents with a MongoDB aggregation pipeline. Colleges with no reviews return `0` and `0`.',
    ].join('\n'),
  },
  servers: [
    { url: `http://localhost:${env.port}`, description: 'Local development' },
  ],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Colleges' },
    { name: 'Reviews' },
    { name: 'Users' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'Service is running',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a teacher or student',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
              examples: {
                student: {
                  value: {
                    name: 'Ada Student',
                    email: 'ada@example.com',
                    password: 'Password123',
                    role: 'student',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Registration successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          400: error('Validation failed'),
          409: error('Email already registered'),
          429: error('Too many authentication attempts'),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive a JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
              examples: {
                login: {
                  value: { email: 'ada@example.com', password: 'Password123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          400: error('Validation failed'),
          401: error('Invalid email or password'),
          429: error('Too many authentication attempts'),
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the authenticated user',
        security: bearer,
        responses: {
          200: {
            description: 'Current user',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
          401: error('Missing, invalid, or expired token'),
        },
      },
    },
    '/api/colleges': {
      get: {
        tags: ['Colleges'],
        summary: 'List colleges with search, filters, sorting, and rating stats',
        parameters: [
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/limit' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Case-insensitive name search' },
          { name: 'location', in: 'query', schema: { type: 'string' }, description: 'Case-insensitive location filter' },
          {
            name: 'sortBy',
            in: 'query',
            schema: { type: 'string', enum: ['name', 'createdAt', 'averageRating'], default: 'createdAt' },
          },
          {
            name: 'sortOrder',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          },
        ],
        responses: {
          200: {
            description: 'Paginated college list including averageRating and reviewCount',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
          400: error('Invalid query parameters'),
        },
      },
      post: {
        tags: ['Colleges'],
        summary: 'Create a college (Admin only)',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CollegeRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'College created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
          400: error('Validation failed'),
          401: error('Authentication required'),
          403: error('Admin role required'),
          409: error('Duplicate college name and location'),
        },
      },
    },
    '/api/colleges/{id}': {
      get: {
        tags: ['Colleges'],
        summary: 'Get college details and rating statistics',
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: {
          200: { description: 'College retrieved' },
          400: error('Invalid id'),
          404: error('College not found'),
        },
      },
      patch: {
        tags: ['Colleges'],
        summary: 'Update a college (Admin only)',
        security: bearer,
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CollegeRequest' },
            },
          },
        },
        responses: {
          200: { description: 'College updated' },
          400: error('Validation failed'),
          401: error('Authentication required'),
          403: error('Admin role required'),
          404: error('College not found'),
          409: error('Duplicate college name and location'),
        },
      },
      delete: {
        tags: ['Colleges'],
        summary: 'Delete a college and its reviews (Admin only)',
        security: bearer,
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: {
          204: { description: 'College deleted. Associated reviews are deleted in the same operation.' },
          400: error('Invalid id'),
          401: error('Authentication required'),
          403: error('Admin role required'),
          404: error('College not found'),
        },
      },
    },
    '/api/colleges/{collegeId}/reviews': {
      get: {
        tags: ['Reviews'],
        summary: 'List reviews for a college',
        parameters: [
          { $ref: '#/components/parameters/collegeId' },
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/limit' },
          { name: 'rating', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 5 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search review comments' },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['createdAt', 'rating'] } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: {
          200: { description: 'Paginated reviews' },
          400: error('Invalid parameters'),
          404: error('College not found'),
        },
      },
      post: {
        tags: ['Reviews'],
        summary: 'Create a review for a college',
        description: 'The reviewer is taken from the JWT. Do not send userId in the body.',
        security: bearer,
        parameters: [{ $ref: '#/components/parameters/collegeId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ReviewRequest' },
            },
          },
        },
        responses: {
          201: { description: 'Review created' },
          400: error('Validation failed'),
          401: error('Authentication required'),
          404: error('College not found'),
          409: error('User already reviewed this college'),
        },
      },
    },
    '/api/reviews': {
      get: {
        tags: ['Reviews'],
        summary: 'List reviews with pagination and filters',
        parameters: [
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/limit' },
          { name: 'collegeId', in: 'query', schema: { type: 'string' } },
          { name: 'userId', in: 'query', schema: { type: 'string' } },
          { name: 'rating', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 5 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['createdAt', 'rating'] } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: {
          200: { description: 'Paginated reviews' },
          400: error('Invalid query parameters'),
        },
      },
    },
    '/api/reviews/{id}': {
      get: {
        tags: ['Reviews'],
        summary: 'Get a review',
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: {
          200: { description: 'Review retrieved' },
          400: error('Invalid id'),
          404: error('Review not found'),
        },
      },
      patch: {
        tags: ['Reviews'],
        summary: 'Update a review (owner or Admin)',
        security: bearer,
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ReviewRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Review updated' },
          400: error('Validation failed'),
          401: error('Authentication required'),
          403: error('Not the owner and not an Admin'),
          404: error('Review not found'),
        },
      },
      delete: {
        tags: ['Reviews'],
        summary: 'Delete a review (owner or Admin)',
        security: bearer,
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: {
          204: { description: 'Review deleted' },
          401: error('Authentication required'),
          403: error('Not the owner and not an Admin'),
          404: error('Review not found'),
        },
      },
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'List users (Admin only)',
        security: bearer,
        parameters: [
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/limit' },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['admin', 'teacher', 'student'] } },
        ],
        responses: {
          200: { description: 'Paginated users' },
          401: error('Authentication required'),
          403: error('Admin role required'),
        },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get a user (Admin only)',
        security: bearer,
        parameters: [{ $ref: '#/components/parameters/id' }],
        responses: {
          200: { description: 'User retrieved' },
          401: error('Authentication required'),
          403: error('Admin role required'),
          404: error('User not found'),
        },
      },
    },
    '/api/users/{id}/role': {
      patch: {
        tags: ['Users'],
        summary: 'Change a user role (Admin only)',
        security: bearer,
        parameters: [{ $ref: '#/components/parameters/id' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: { type: 'string', enum: ['admin', 'teacher', 'student'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Role updated' },
          401: error('Authentication required'),
          403: error('Admin role required or self-demotion blocked'),
          404: error('User not found'),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Send `Authorization: Bearer <token>` from login or register.',
      },
    },
    parameters: {
      id: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
      },
      collegeId: {
        name: 'collegeId',
        in: 'path',
        required: true,
        schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
      },
      page: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', minimum: 1, default: 1 },
      },
      limit: {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: {},
          meta: { $ref: '#/components/schemas/PaginationMeta' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
          hasNextPage: { type: 'boolean' },
          hasPrevPage: { type: 'boolean' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 80 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, description: 'At least one letter and one number' },
          role: { type: 'string', enum: ['teacher', 'student'], default: 'student' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/PublicUser' },
              token: { type: 'string' },
            },
          },
        },
      },
      PublicUser: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'teacher', 'student'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CollegeRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          location: { type: 'string' },
          website: { type: 'string', format: 'uri', nullable: true },
        },
      },
      ReviewRequest: {
        type: 'object',
        properties: {
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string', maxLength: 2000 },
        },
      },
    },
  },
};

export default spec;

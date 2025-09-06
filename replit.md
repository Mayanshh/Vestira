# Overview

This is a video reel sharing platform backend API built with Node.js and Express. The application allows partners (content creators) to upload video reels with pricing, while regular users can view and interact with the content. It features a dual-user system with role-based authentication, video hosting through ImageKit, and social features like likes and saves.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Backend Framework
- **Express.js**: RESTful API server handling authentication, reel management, and user interactions
- **Node.js**: Runtime environment for server-side JavaScript execution

## Database Design
- **MongoDB with Mongoose**: NoSQL database for flexible document storage
- **Dual User Model**: Separate collections for regular users and content creator partners
- **Relational References**: Reels linked to partners, with user interactions tracked through ObjectId references

## Authentication & Authorization
- **JWT Token-Based Auth**: Stateless authentication using JSON Web Tokens stored in HTTP-only cookies
- **bcryptjs Password Hashing**: Secure password storage with salt-based hashing
- **Role-Based Access Control**: Middleware distinguishing between users and partners with different permissions
- **Cookie Security**: Secure cookie handling with environment-specific settings

## File Management
- **ImageKit Integration**: Third-party service for video upload, storage, and delivery
- **Base64 Upload Support**: Handles video data in Base64 format for web uploads
- **Organized Storage**: Videos stored in structured folders within ImageKit

## API Structure
- **Modular Routing**: Separate route handlers for authentication and reel operations
- **Middleware Chain**: Authentication and role verification middleware for protected routes
- **Controller Pattern**: Business logic separated into dedicated controller files

## Data Models
- **Users**: Basic accounts for content consumption (username, email, password)
- **Partners**: Content creator accounts with additional brand information
- **Reels**: Video content with pricing, metadata, and interaction tracking

## Environment Configuration
- **dotenv**: Environment variable management for sensitive configuration
- **Development vs Production**: Environment-specific settings for security and performance

# External Dependencies

## Cloud Services
- **ImageKit**: Video hosting, processing, and CDN delivery service
- **MongoDB Atlas**: Cloud database hosting (likely used for production)

## NPM Packages
- **express**: Web application framework
- **mongoose**: MongoDB object modeling
- **jsonwebtoken**: JWT implementation for authentication
- **bcryptjs**: Password hashing library
- **cookie-parser**: HTTP cookie parsing middleware
- **dotenv**: Environment variable loader

## Authentication Infrastructure
- **JWT Secret**: Environment-based token signing key
- **Cookie Management**: Browser cookie handling for session management

## Media Processing
- **ImageKit API**: Video upload, transformation, and delivery
- **Base64 Encoding**: Client-side video encoding for upload
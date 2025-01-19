# Video Processing API

## Overview

This project is a **Video Processing API** built with **NestJS** that allows users to:
- Upload videos with validation on size and duration.
- Perform operations like trimming, merging, and sharing videos.
- Generate shareable links for videos with optional expiry.

Authentication is enforced using **Bearer Token** validation.

---

## Features

### 1. **Video Upload**
- **Endpoint:** `POST /videos/upload`
- Allows users to upload videos while validating:
  - Maximum size (`maxSize`).
  - Duration bounds (`minDuration` and `maxDuration`).
- Videos are stored for further operations.

### 2. **Video Trimming**
- **Endpoint:** `POST /videos/trim`
- Users can specify the start and end times to create a trimmed version of an uploaded video.
- Either `start` or `end` (or both) can be provided.

### 3. **Video Merging**
- **Endpoint:** `POST /videos/merge`
- Combines two or more uploaded videos into a single file.
- At least two valid video IDs must be provided.

### 4. **Shareable Links**
- **Endpoint:** `POST /videos/share`
- Generates a unique link for sharing a video, with an optional expiry.
- Links can be accessed via `GET /videos/shared/:id`.

### 5. **List Videos**
- **Endpoint:** `GET /videos`
- Returns a list of all uploaded videos.

---

## Components and Their Purpose

### **1. NestJS**
- **Reason:** Modular architecture allows for separation of concerns (controllers, services, guards, etc.).

### **2. TypeORM**
- **Purpose:** ORM for seamless database integration.
- **Why Chosen:** Supports entities for managing video and shared link models with relationships and is compatible with SQLite for testing.

### **3. FFmpeg (Video Processing Library)**
- **Purpose:** Handles video operations like trimming, merging, and analyzing metadata.
- **Why Chosen:** A powerful and widely-used library for video and audio processing.

### **4. Jest**
- **Purpose:** Framework for writing and running tests.
- **Why Chosen:** Comes pre-integrated with NestJS and supports unit and e2e testing.

---

## Testing

### Dockerized Testing
- The tests automatically run during the Docker image build process to ensure the application is functioning as expected.

### Manual Testing
- You can also run the application and tests outside of Docker.
- Ensure **FFmpeg** is installed on your system before proceeding.

To run tests locally:
```bash
npm run test
```


To get test coverage report:
```bash
npm run test:cov
```


---

## How to Run using Docker

#### Build and Run Docker Container
```bash
docker build -t video-processing-api .
docker run -p 3000:3000 video-processing-api
```

### 3. Access API Documentation
- API documentation is available at: `http://localhost:3000/docs`
- Pass the value defined in `.env` (i.e) **"my-token"** to access authenticated APIs.

### Run Locally
If you prefer running the app locally:
```bash
npm run start:dev
```
Ensure **FFmpeg** is installed on your system before running the application.


### Coverage Report

![coverage report](https://github.com/IamAnkitSharma/video-transformer/blob/main/coverage.png?raw=true)

Here app.module.ts and main.ts are reinitialized while testing hence they are not covered.
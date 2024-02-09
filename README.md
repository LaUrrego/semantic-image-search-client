# React Client Application for Image Gallery with Semantic Search

This React application serves as the client-side for a photo storage app, integrating with Supabase for authentication, storage, and handling image uploads. It allows users to log in using magic links, upload images, and view a gallery of their uploaded images. The application also integrates with a Python microservice to generate and store embeddings for images, enabling semantic search capabilities.

## Features

- User authentication with Supabase using magic links.
- Image upload functionality to Supabase storage.
- Gallery view of uploaded images with the option to delete.
- Integration with a Python FastAPI microservice for generating image embeddings.

## Prerequisites

Before you start, make sure you have the following:

- Node.js installed on your machine.
- A Supabase account and project set up for the database and authentication.
- The `.env` file configured with your Supabase URL (`REACT_APP_SB_URL`), API key (`REACT_APP_SB_API_KEY`), and CDN URL (`REACT_APP_CDNURL`).

## Setup and Installation

1. Clone the repository to your local machine.
2. Navigate to the project directory and install the dependencies:

```
    npm install
```

3. Create a `.env` file in the root of your project directory and fill in your Supabase details:

```
    REACT_APP_SB_URL=your_supabase_url
    REACT_APP_SB_API_KEY=your_supabase_api_key
    REACT_APP_CDNURL=your_cdn_url_for_images
```

4. To start the application, run:

```
    npm start
```

This will launch the application on `http://localhost:3000`.

## Usage

### Logging In

- Open the application in your browser.
- Enter your email address and click "Get Link" to receive a magic link for authentication.
- Check your email and click on the magic link to log in.

### Uploading Images

- Once logged in, you can upload images by clicking the "choose file" button.
- Select an image file (PNG or JPEG) and it will automatically upload to your gallery.

### Viewing the Gallery

- After uploading, images will appear in the gallery section.
- Each image can be deleted using the "Delete Image" button below it.

### Logging Out

- To log out, click the "Sign Out" button at the top of the page.

## Integration with Python Microservice

- The React application sends the image URL to the Python microservice for embedding generation.
- The microservice returns the embedding, which is then stored in Supabase by the React application.

## Contributing

Contributions to the project are welcome. Please ensure you follow the established code style and add unit tests for any new or changed functionality.

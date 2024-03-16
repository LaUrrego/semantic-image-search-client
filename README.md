# React Client Application for Image Gallery with Semantic Search

This React project serves as the client-side for an AI augmented photo storage and semantic search app, integrating Supabase for authentication, storage, and handling image uploads. It allows users to log in using magic links or traditional e-mail/password, upload images, and view a gallery of their uploaded images. The application also integrates with a Python microservice to generate embeddings for images and search prompts, enabling semantic search capabilities. The microservice can be found [here](https://github.com/LaUrrego/semantic-image-search-microservice).

## Features

- User authentication with Supabase using magic links and e-mail/passwords.
- Image upload functionality to Supabase storage.
- Gallery view of uploaded images with the option to delete and view larger sizes.
- Integration with a Python FastAPI microservice for generating image and prompt embeddings.
- On-demand image resizing using imgProxy to provide a consistent and smooth gallery experience.
- Search history saving and suggestion retrieval using a dedicated microservice. Repo found [here](https://github.com/cameronch98/search-microservice). 

## Prerequisites

Before you start, make sure you have the following:

- Node.js installed on your machine.
- A Supabase account and project set up for the database and authentication.
- The `.env` file configured with your Supabase URL (`REACT_APP_SB_URL`), API key (`REACT_APP_SB_API_KEY`), and CDN URL (`REACT_APP_CDNURL`).
- Docker Desktop (or an equivalent) installed for running imgProxy.

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

4. Download and run imgProxy using Docker:

```
docker pull darthsim/imgproxy
docker run -p 8080:8080 -it darthsim/imgproxy
```

5. Clone and run the search results microservice:

```
git clone https://github.com/cameronch98/search-microservice.git
cd search-microservice
python3 -m venv venv
source venv/bin/activate  # For Unix/Linux
venv\Scripts\activate.bat  # For Windows
pip install -r requirements.txt
python app.py
npm start

```
6. Start the FastAPI server:

```
cd path/to/server
uvicorn main:app --reload
```

7. To start the React application, run:

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
- Each image can be deleted using the "Delete Image" button below it as well as a "View Larger" button to see the full size that was uploaded.

### Logging Out

- To log out, click the "Sign Out" button at the top of the page.

## Integration with Python Microservice

- The React application sends the image URL to the Python microservice for embedding generation.
- The microservice returns the embedding, which is then stored in Supabase by the React application.
- When searching, the prompt is sent to the microservice which in turn responds with a corresponding embedding. 
- Using the same model for both ensures useable results. Matches are done through cosine similarity, written as Postgres function and queried to return a table of results belonging only to the current user, and matching with a similarity threshold of 0.24 or more. This value was determined based on the CLIP model's training on [Unsplash](https://unsplash.com/) images and results when conducting comparisons with controlled search inputs. Later work will look at reinforcing a variation of this model to achieve a high confidence match by training it on a variety of image/text pair inputs. 

## Search History and Suggestions

- The search microservice saves the search history of users in a MongoDB database.
- The React application can retrieve the search history and provide suggestions for search terms, similar to Google's search bar.
- New search terms are added to the search history when users perform searches.

## Contributing

Contributions to the project are welcome. Please ensure you follow the established code style and add unit tests for any new or changed functionality.

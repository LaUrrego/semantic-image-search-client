import './App.css';
import { useState, useEffect } from 'react';
// container from bootstrap to allow for consistent styling
import { Container, Form, Button, Card, CardImgOverlay } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css'
import { useSession, useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
// used to generate unique user id's to attach to images
import { v4 as uuidv4 } from 'uuid'
import Search from './components/Search'
// Styling to accomodate various sized images
import Masonry from 'react-masonry-css'
// on the fly image resizing
import { createImgproxyUrl } from './imageUtils';


const CDNURL = process.env.REACT_APP_CDNURL;
// getting images is then:
// CDNURL + user.id + '/' + image.name 

function App() {
  const user = useUser();
  const session = useSession()
  const supabase = useSupabaseClient();
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [images, setImages] = useState([])
  console.log(email)
  console.log(password)

  let suggestions = [
    "dogs",
    "school",
    "birthday",
    "car",
    "graduation ceremony",
    "lake day",
    "school documents",
    "dogs"
  ];

  // function to get all images from a user's folder
  async function getImages(){
    const { data, error } = await supabase
      .storage
      .from('images')
      .list(user?.id + '/', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc'}
      });
      // returns a list that looks like:
      // [image1, image2, image3]
      // image1 : { name: "filename.png" }
      // image loading works by appending to the end of our CDN link
      if(data !== null) {
        setImages(data)
      } else {
        alert("Error loading images")
        console.log(error)
      }
  };

  // this is for loading code in an initial state, that is then changed based on when a given parameter changes
  // here we load images to the screen whenever user changes
  useEffect(()=>{
    if(user){
      // load with all images of the user as long as the user exists 
      getImages();
    }
  },[user]);

  // function to use the entered e-mail with Supabase authentication and useState
  async function loginPage() {
    const {data, error} = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if(data){console.log(data)}
    if(error){
      alert("Error logging in. Make sure to use a valid account e-mail and password, or sign up for a new account!");
      console.log(error);
    } else {
      alert("Welcome Back!");
    }
  };

  async function signUp() {
    const {data, error} = await supabase.auth.signUp({
      email: email,
      password: password
    });

    if (data){console.log(data)}
    if (error){
      alert("Error communicating with Supabase, make sure to use a real e-mail and password with 6 character minimum!");
      console.log(error);
    } else {
      alert("Check your e-mail for a confirmation link!");
    }
  };

  // function to signout a user, leveraging useUser
  async function signOut(){
    const {error} = await supabase.auth.signOut();
    if(error){console.log("error logging out: ", error)};
  };
  
  // function to upload an image to Supabase 
  async function uploadImage(e){
    // grab the file from target, first item
    
    let file = e.target.files[0];
    const imageUuid = uuidv4();
    const imagePath = `${user.id}/${imageUuid}`;

    // thanks to supabase bucket policy, only unique user id gets access to their own folder
    const {data, error} = await supabase
      .storage
      .from('images')
      .upload(imagePath, file) // get the user's id, and attach a unique identifier + the file
      
      if (data) {
        let sendData = {
          'imageUrl': CDNURL + imagePath
        }

        // Send data to Python server
        fetch('http://127.0.0.1:8000/upload', {
          method: 'POST',
          headers: {
            'Content-type': 'application/json'
          },
          body: JSON.stringify(sendData)
        }).then(
          // response contains an embedding 
          response => response.json()
        ).then(
          // store in database
          async response => {
            const { data, error } = await supabase.from('images').insert({
              user_id: user.id,
              image_id: imageUuid,
              image_url: CDNURL + imagePath,
              embedding: response.embedding
              }).select()

              if (data){
                console.log("Success!", data)
              } else {
                console.log("Error with upload: ", error)
              }
          }
        ).catch(
          error => console.log("Error from server: ", error)
        );
        // load images
        getImages();

      } else {
        console.log(error)
      };

  };

  // function to delete images from database
  async function deleteImage(imageName){
    // provide a confirmation of deletion
    if(window.confirm("Are you sure you want to delete?")){
      try {
        // attempt to remove from supabase storage
        const {error: storageError} = await supabase
          .storage
          .from('images')
          .remove([ user.id + '/' + imageName])
        
        // storage error detected
        if (storageError){
          alert(storageError.message);
          return;
        }

        // attempt to remove from supabase database
        const {error: dbError} = await supabase
          .from('images')
          .delete()
          .eq('image_id', imageName)
        
        // database delete error detected
        if (dbError){
          alert(dbError.message);
        } else {
          // no errors with deleting from either
          getImages();
        }

      } catch (error){
        alert("An unexpected error occurred:", error.message);
      }
    }
  };

  return (
    <Container align='center' className='container-sm mt-4'>
      {
        /**
         * If user null, show login page
         * otherwise, show their gallery
         */
      }
      {
        user === null ? 
        <>
          <h1>Welcome to Pic-Search!</h1>
          <Card style={{maxWidth:"600px"}}>
            <Card.Body>
              <Card.Header></Card.Header>
                <Form>
                  <Form.Group className='mb-3' style={{maxWidth: "500px"}}>
                    <Form.Text className='my-3'>
                      Enter your login details to continue. If it's your first time here, enter a new e-mail and password (6 character minimum) to sign up! You will need to confirm your e-mail before getting started!
                    </Form.Text>

                    <Form.Group>
                    <Form.Label className='my-3' htmlFor='email'>E-mail:</Form.Label>
                    <Form.Control
                    type='email'
                    id="email"
                    onChange={(e)=> setEmail(e.target.value)}
                    />
                    </Form.Group>

                    <Form.Group>
                    <Form.Label className='my-3' htmlFor="inputPassword">Password:</Form.Label>
                    <Form.Control
                    type="password"
                    id="inputPassword"
                    onChange={(e)=>setPassword(e.target.value)}
                    />
                    </Form.Group>

                  </Form.Group>
                  <Button variant='primary' onClick={()=> loginPage()}>
                      Login
                  </Button>
                  {" "}
                  <Button variant='primary' onClick={()=> signUp()}>
                      Sign Up
                  </Button>
                  
                </Form>
            </Card.Body>
          </Card>
        </>

        :

        <>
          <h1>Welcome to Pic-Search!</h1>
          <Button onClick={()=> signOut()}>Sign Out</Button>
          <p>Current user: {user.email}</p>
          <hr/>
          <p>Use the choose file button to upload images to your gallery. Use PNG and JPEG only.</p>
          <Search deleteImage={deleteImage} suggestions={suggestions}></Search>
          <Form.Group className='mb-3' style={{maxWidth: "500px"}}>
            <Form.Control type='file' accept='image/png, image/jpeg' onChange={(e)=> uploadImage(e)}></Form.Control>
            
          </Form.Group>
          <hr/>
          <h3>Your Gallery</h3>
            {/** getting images is then: CDNURL + user.id + '/' + image.name 
            /*https://www.npmjs.com/package/react-masonry-css*/}
            <Masonry
            breakpointCols={{
              default: 4,
              1100: 3,
              700: 2,
              500:1
            }}
            className='my-masonry-grid'
            columnClassName='my-masonry-grid_column'
            >
              {images.map((image) => (
              <Card key={CDNURL + user.id + '/' + image.name} className='image-card'>
                <Card.Img  variant='top' src={createImgproxyUrl(`${CDNURL + user.id + '/' + image.name}`, 300)}/>
                <CardImgOverlay className='image-overlay'>
                    <Button className='image-button' variant='danger' onClick={() => deleteImage(image.name)}>Delete Image</Button>
                    <Button className='image-button' variant='primary' href={CDNURL + user.id + '/' + image.name}>Full Size</Button>
                </CardImgOverlay>
              </Card>
              ))}
            </Masonry>
        </>
      }
    </Container>
  );
}

export default App;
// run app with npm start
// run docker container for image utility with:
// docker run -p 8080:8080 -it darthsim/imgproxy
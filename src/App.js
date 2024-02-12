import './App.css';
import { useState, useEffect } from 'react';
// container from bootstrap to allow for consistent styling
import { Container, Form, Button, Row, Col, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css'
import { useSession, useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
// used to generate unique user id's to attach to images
import { v4 as uuidv4 } from 'uuid'


const CDNURL = process.env.REACT_APP_CDNURL;
// getting images is then:
// CDNURL + user.id + '/' + image.name 

function App() {
  const user = useUser();
  const session = useSession()
  const supabase = useSupabaseClient();
  const [email, setEmail] = useState("")
  const [images, setImages] = useState([])
  console.log(email)

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
  async function magicLinkLogin() {
    const {data, error} = await supabase.auth.signInWithOtp({
      email:email
    });
    if(error){
      alert("Error communicating with Supabase, make sure to use a real email address");
      console.log(error);
    } else {
      alert("Check your e-mail for a Supabase magiclink!");
    }
  }

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
      const {error} = await supabase
      .storage
      .from('images')
      .remove([ user.id + '/' + imageName])
      .then(
        async ()=>{
          const {error} = await supabase
          .from('images')
          .delete()
          .eq('image_id', imageName)
          
          if(error){alert(error)}
        }
      )
    
    if(error){
      alert(error)
    } else {
      // as long as there as no errors, refresh to get all images again
      getImages();
    };
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
          <h1>Welcome</h1>
          <Form>
            <Form.Group className='mb-3' style={{maxWidth: "500px"}}>
              <Form.Label>Enter an e-mail to sign-in using supabase link</Form.Label>
              <Form.Control
              type='email'
              placeholder='Input e-mail'
              onChange={(e)=> setEmail(e.target.value)}
              />
            </Form.Group>
            <Button variant='primary' onClick={()=> magicLinkLogin()}>
                Get Link
            </Button>
          </Form>
        </>

        :

        <>
          <h1>Your Gallery</h1>
          <Button onClick={()=> signOut()}>Sign Out</Button>
          <p>Current user: {user.email}</p>
          <hr/>
          <p>Use the choose file button to upload images to your gallery. Use PNG and JPEG only.</p>
          <Form.Group className='mb-3' style={{maxWidth: "500px"}}>
            <Form.Control type='file' accept='img/png, img/jpeg' onChange={(e)=> uploadImage(e)}></Form.Control>
          </Form.Group>
          <hr/>
          <h3>Your Images</h3>
            {
              /** 
              * getting images is then:
               CDNURL + user.id + '/' + image.name  */
            }
            <Row xs={1} md={3} className='g-4'>
              {images.map((image)=>{
                return(
                  <Col key={CDNURL + user.id + '/' + image.name}>
                    <Card>
                      <Card.Img variant='top' src={CDNURL + user.id + '/' + image.name}/>
                      <Card.Body>
                        <Button variant='danger' onClick={()=> deleteImage(image.name)}>Delete Image</Button>{' '}
                        <Button variant='primary' href={CDNURL + user.id + '/' + image.name} >Full Size</Button>
                      </Card.Body>
                    </Card>
                  </Col>
                )
              })}
            </Row>

        </>
      }
    </Container>
  );
}

export default App;

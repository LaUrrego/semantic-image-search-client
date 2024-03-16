import Modal from 'react-bootstrap/Modal';
import Masonry from 'react-masonry-css'
import { Button, Card, CardImgOverlay } from 'react-bootstrap';
import { createImgproxyUrl } from '../imageUtils';

export default function SearchResults({results, showResult, setShowResult, deleteImage}) {

  return (
    <>
      <Modal
        size="lg"
        show={showResult}
        onHide={() => setShowResult(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Search Results
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
                {results.map((image)=>{
                    return(
                      <Card key={image.image_id} className='image-card'>
                        <Card.Img variant='top' src={createImgproxyUrl(`${image.image_url}`, 300)}  ></Card.Img>
                        <CardImgOverlay className='image-overlay' >
                          <Button className='image-button' variant='danger' onClick={()=>deleteImage(image.name)} >Delete Image</Button>
                          <Button className='image-button' variant='primary' href={image.image_url} >Full Size</Button>
                        </CardImgOverlay>
                      </Card>)
                })}
              </Masonry>
        </Modal.Body>
      </Modal>
    </>
  );
}


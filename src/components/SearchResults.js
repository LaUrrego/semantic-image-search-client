import Modal from 'react-bootstrap/Modal';
import { Button, Row, Col, Card } from 'react-bootstrap';

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
            <Row xs={1} md={3} className='g-4'>
                {results.map((image)=>{
                    return(
                    <Col key={image.image_id}>
                        <Card>
                        <Card.Img variant='top' src={image.image_url}/>
                        <Card.Body>
                            <Button variant='danger' onClick={()=> deleteImage(image.name)}>Delete Image</Button>{' '}
                            <Button variant='primary' href={image.image_url} >Full Size</Button>
                        </Card.Body>
                        </Card>
                    </Col>
                    )
                })}
            </Row>
        </Modal.Body>
      </Modal>
    </>
  );
}


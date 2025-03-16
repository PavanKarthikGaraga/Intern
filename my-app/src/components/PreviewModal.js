import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const PreviewModal = ({ show, handleClose, fileId }) => {
  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>File Preview</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <iframe
          src={`https://drive.google.com/file/d/${fileId}/preview`}
          width="100%"
          height="480"
          frameBorder="0"
          allowFullScreen
        ></iframe>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PreviewModal;

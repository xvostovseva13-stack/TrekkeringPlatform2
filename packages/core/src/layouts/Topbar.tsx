import { Navbar, Container, Form, InputGroup, Button, Dropdown } from 'react-bootstrap';
import { HiOutlineMagnifyingGlass, HiOutlineBell, HiOutlineUserCircle } from 'react-icons/hi2';

const Topbar = () => {
  return (
    <Navbar bg="white" className="border-bottom sticky-top px-3" style={{ height: '60px' }}>
      <Container fluid className="p-0">
        <div className="d-flex justify-content-between align-items-center w-100">
          
          {/* Search Bar */}
          <div style={{ maxWidth: '400px' }} className="w-50">
            <InputGroup>
              <InputGroup.Text className="bg-light border-end-0">
                <HiOutlineMagnifyingGlass className="text-muted" />
              </InputGroup.Text>
              <Form.Control 
                type="search" 
                placeholder="Search..." 
                className="bg-light border-start-0 shadow-none" 
              />
            </InputGroup>
          </div>

          {/* Right Actions */}
          <div className="d-flex align-items-center gap-3">
            <Button variant="link" className="text-dark p-1 position-relative">
              <HiOutlineBell size={24} />
              <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                <span className="visually-hidden">New alerts</span>
              </span>
            </Button>

            <div className="vr h-50 my-auto"></div>

            <Dropdown align="end">
              <Dropdown.Toggle variant="link" id="dropdown-profile" className="text-dark text-decoration-none p-0 d-flex align-items-center gap-2">
                 <HiOutlineUserCircle size={32} className="text-secondary" />
                 <span className="fw-medium small d-none d-md-block">User Profile</span>
              </Dropdown.Toggle>

              <Dropdown.Menu className="shadow-sm border-0 mt-2">
                <Dropdown.Item href="#/settings">Settings</Dropdown.Item>
                <Dropdown.Item href="#/profile">Profile</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item href="#/logout" className="text-danger">Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>

        </div>
      </Container>
    </Navbar>
  );
};

export default Topbar;

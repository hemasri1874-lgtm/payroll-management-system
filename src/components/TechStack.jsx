import React from 'react'

const TechStack = () => {
  const stack = [
    {
      category: 'Frontend',
      icon: 'bi-window-fullscreen',
      items: [
        { name: 'React', description: 'v19.1 - UI Library' },
        { name: 'Vite', description: 'Build Tool' },
        { name: 'Bootstrap', description: 'v5.3 - CSS Framework' },
        { name: 'face-api.js', description: 'Face Recognition in Browser' },
        { name: 'Axios', description: 'HTTP Client' },
        { name: 'React Router DOM', description: 'Routing' }
      ]
    },
    {
      category: 'Backend',
      icon: 'bi-server',
      items: [
        { name: 'Java', description: 'v17' },
        { name: 'Spring Boot', description: 'v3.3.2 - Core Framework' },
        { name: 'Spring Security', description: 'Authentication & JWT' },
        { name: 'Spring Data JPA', description: 'ORM' },
        { name: 'MySQL', description: 'Relational Database' },
        { name: 'Swagger/OpenAPI', description: 'API Documentation' }
      ]
    },
    {
      category: 'AI / Python Service',
      icon: 'bi-robot',
      items: [
        { name: 'Python', description: 'v3' },
        { name: 'Flask', description: 'v3.0 - Micro Web Framework' },
        { name: 'OpenCV', description: 'Computer Vision (Python Headless)' },
        { name: 'NumPy', description: 'Scientific Computing' }
      ]
    }
  ]

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Project Tech Stack</h2>
      </div>

      <div className="row g-4">
        {stack.map((group, index) => (
          <div className="col-md-4" key={index}>
            <div className="card shadow-sm h-100 border-0">
              <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                <h5 className="card-title text-primary d-flex align-items-center">
                  <i className={`bi ${group.icon} me-2`}></i>
                  {group.category}
                </h5>
              </div>
              <div className="card-body">
                <ul className="list-group list-group-flush">
                  {group.items.map((item, idx) => (
                    <li key={idx} className="list-group-item d-flex justify-content-between align-items-center bg-transparent px-0 border-light">
                      <span className="fw-medium">{item.name}</span>
                      <span className="text-secondary small">{item.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TechStack

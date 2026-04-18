# EinsatzPilot

**EinsatzPilot** is a comprehensive monorepo project designed to streamline operations across various platforms. It comprises a Next.js web application for administrative and office workflows, an Expo-based mobile application tailored for field operations, and a powerful NestJS API backend. The project emphasizes a strong foundational architecture, including robust database management with PostgreSQL and a reliable API infrastructure for authentication, multi-tenancy, business rules, and file management.

## ✨ Key Features & Benefits

*   **Monorepo Architecture**: A unified codebase for the web, mobile, and API applications, facilitating shared packages, consistent development, and simplified dependency management.
*   **Versatile User Interfaces**:
    *   `web/`: A performant and scalable administrative/office web application built with Next.js.
    *   `mobile/`: A cross-platform mobile application developed with Expo, specifically designed for efficient field operations.
*   **Powerful & Scalable Backend**:
    *   `api/`: A structured and extensible API built using NestJS, handling core business logic, authentication, multi-tenancy, and advanced features like file storage and reporting.
*   **Robust Foundational Development**: Initial focus on platform stability, evidenced by thorough PostgreSQL migrations and API smoke testing, ensuring a solid and reliable base for future feature expansion.
*   **Integrated File Management**: Support for file uploads and storage, as indicated by the `storage/uploads` structure, for handling various project assets.

## 🛠️ Technologies & Tools

The EinsatzPilot project leverages a modern stack to ensure high performance, scalability, and maintainability.

### Languages

*   **JavaScript**: The core language for development.
*   **TypeScript**: Provides type safety and enhances code quality across the monorepo.

### Tools & Frameworks

*   **Node.js**: The runtime environment for the backend and build processes.
*   **pnpm**: A fast, disk space efficient package manager used across the monorepo.
*   **Next.js**: (In `apps/web/`) A React framework for production-grade web applications.
*   **Expo**: (In `apps/mobile/`) A framework for universal React applications, enabling fast development of mobile apps.
*   **NestJS**: (In `apps/api/`) A progressive Node.js framework for building efficient, reliable, and scalable server-side applications.
*   **Prisma**: An open-source ORM that simplifies database access, migration, and management (hinted by `prisma:generate` in `api/package.json`).
*   **PostgreSQL**: A powerful, open-source relational database system, used for data persistence.

## 🚀 Getting Started

Follow these instructions to set up and run the EinsatzPilot project locally.

### Prerequisites

Before you begin, ensure you have the following installed:

*   **Git**: For cloning the repository.
*   **Node.js**: [LTS version recommended](https://nodejs.org/en/download/).
*   **pnpm**: Install globally via `npm install -g pnpm`.
*   **PostgreSQL**: A running instance of PostgreSQL for the API's database.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/atmax1234/EinsatzPilot.git
    cd EinsatzPilot
    ```

2.  **Install pnpm dependencies**:
    This will install all dependencies for the monorepo's packages.
    ```bash
    pnpm install
    ```

3.  **Environment Variables**:
    Create `.env` files in the `apps/api` (and potentially `apps/web`, `apps/mobile` later) directories. These files will contain sensitive configuration details like database connection strings and API keys.

    For the API, create `apps/api/.env` with content similar to:
    ```env
    # apps/api/.env
    DATABASE_URL="postgresql://user:password@localhost:5432/einsatzpilot_db?schema=public"
    # Other API specific environment variables
    PORT=3000
    ```
    *Make sure to replace `user`, `password`, `localhost:5432`, and `einsatzpilot_db` with your actual PostgreSQL credentials and database name.*

4.  **Database Setup (Prisma)**:
    Navigate to the `apps/api` directory and set up the database.
    ```bash
    cd apps/api
    pnpm prisma migrate dev --name init # Apply migrations and create your database schema
    pnpm prisma generate             # Generate Prisma client for your application
    cd ../.. # Return to the root directory
    ```
    *If prompted, you can choose a name for your migration (e.g., `init`).*

### Running the Applications

You can run individual applications within the monorepo.

#### API Backend (`apps/api`)

To start the NestJS API in development mode with live reloading:

```bash
pnpm --filter @einsatzpilot/api start:dev
# Alternatively, navigate to apps/api and run:
# cd apps/api
# pnpm start:dev
```
The API will typically run on `http://localhost:3000` (or the port specified in your `.env`).

To build the API for production:

```bash
pnpm --filter @einsatzpilot/api build
# cd apps/api
# pnpm build
```

To run the built API in production mode:

```bash
pnpm --filter @einsatzpilot/api start
# cd apps/api
# pnpm start
```

#### Web Application (`apps/web`) & Mobile Application (`apps/mobile`)

Specific scripts for running `web` and `mobile` applications are not yet fully defined but will likely follow a similar pattern:

```bash
# Example for web app (assuming 'web' app exists and has a 'dev' script)
# pnpm --filter @einsatzpilot/web dev

# Example for mobile app (assuming 'mobile' app exists and has a 'start' script)
# pnpm --filter @einsatzpilot/mobile start
```
*Consult the respective `apps/web/README.md` and `apps/mobile/README.md` (once created) for detailed instructions.*

## 📖 Usage & API Documentation

Currently, the primary focus is on establishing the foundational architecture.

*   **API Usage**: Once the API is running, you can interact with it using tools like [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/). As features are developed, specific endpoints and their functionalities will be documented.
*   **Web/Mobile Usage**: After their respective setup and run processes, the web and mobile applications will provide user interfaces for interacting with the system.

Future plans include comprehensive API documentation (e.g., using OpenAPI/Swagger) as more feature endpoints are developed beyond the foundational phase.

## ⚙️ Configuration

Key configurations are managed through environment variables, typically defined in `.env` files within each application directory.

*   **Database Connection**: Configured via `DATABASE_URL` in `apps/api/.env`.
*   **Server Ports**: Defined by `PORT` variable in `apps/api/.env`.
*   **Other Settings**: Application-specific settings, API keys, and service URLs will also be managed via environment variables.

For more detailed configuration options, refer to the source code and potential configuration files within each application package.

## 🤝 Contributing

We welcome contributions to the EinsatzPilot project! To contribute, please follow these steps:

1.  **Fork** the repository.
2.  **Create a new branch** for your feature or bug fix: `git checkout -b feature/your-feature-name` or `git checkout -b bugfix/issue-description`.
3.  **Make your changes** and ensure they adhere to the project's coding standards.
4.  **Run checks**: Ensure `pnpm typecheck` (from `apps/api`) and any future `lint` or `test` scripts pass. The `FOUNDATION_CHECKLIST.md` provides insights into core system readiness.
5.  **Commit your changes** with a clear and descriptive commit message.
6.  **Push your branch** to your forked repository.
7.  **Open a Pull Request** to the `main` branch of the original repository, describing your changes and their purpose.

For any questions or further guidance, feel free to open an issue.

## 📄 License

This repository is licensed under the Functional Source License 1.1 (FSL-1.1).

The public repository contains the core platform. Premium modules and other commercial extensions are maintained separately in private repositories.

FSL is a Fair Source license designed for software businesses and includes a two-year conversion to an open source license, as specified in the license text included in this repository.

## 🙏 Acknowledgments

*   **Owner**: `atmax1234`
*   **Frameworks & Libraries**: We are grateful to the developers and communities behind Node.js, TypeScript, Next.js, Expo, NestJS, Prisma, and PostgreSQL for their incredible work.
*   **Contributors**: Thank you to all who contribute to making this project better!

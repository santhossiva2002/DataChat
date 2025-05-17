# DataChat - Interactive Data Analysis with AI

DataChat is a powerful full-stack application that allows users to upload datasets and interact with them using natural language queries. Powered by Google's Gemini AI, this tool provides an intuitive way to explore, visualize, and gain insights from your data without writing complex SQL queries or code.

![DataChat](./assets/app-screenshot.png)

## Features

- **Conversational Data Analysis**: Ask questions about your data in plain English and get immediate answers
- **Intelligent SQL Generation**: Gemini AI automatically converts natural language queries into SQL statements
- **AI-Powered Insights**: Get automated analysis and key insights about your data patterns and trends
- **Interactive Visualizations**: View your data through customizable charts with multiple visualization options
- **Data Export**: Export your data and visualizations in various formats (CSV, PNG, JPG)
- **Custom Color Themes**: Personalize chart visualizations with different color palettes

## Getting Started
   - Live Demo https://github.com/santhossiva2002/datachat
### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Google Gemini API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/santhossiva2002/datachat
   cd datachat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5000`

## Usage Guide

### Uploading Data

1. Use the upload panel to drag and drop or select your data file (CSV, JSON, or SQL)
2. The system will automatically process your file and display a preview
3. Once uploaded, you can start analyzing your data

### Asking Questions

1. Type natural language questions in the chat interface
2. Examples:
   - "How many sales were made in each category?"
   - "What's the total revenue by product category?"
   - "Show me the average order value by month"

### Data Visualization

1. View automatically generated charts based on your data and queries
2. Customize chart types (bar, line, pie, scatter, etc.)
3. Change color themes to match your preferences
4. Export visualizations as PNG or JPG

### AI Insights

1. View AI-generated insights about your data patterns and trends
2. Refresh insights to get different perspectives on your data
3. Use insights as starting points for more detailed analysis

## Technical Details

DataChat is built with a modern full-stack JavaScript architecture:

- **Frontend**: React, TailwindCSS, Chart.js, ShadCN UI components
- **Backend**: Express.js, RESTful API design
- **AI Integration**: Google Gemini API for natural language processing
- **Data Storage**: In-memory storage (can be configured for PostgreSQL)

## Data Privacy

DataChat processes your data locally and does not store any of your data on external servers. When using the Gemini AI capabilities, only the necessary schema information and a small sample of data are sent to the API for processing.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini AI for natural language processing capabilities
- The React and Express.js communities for excellent documentation and tools
- All open-source libraries used in this project

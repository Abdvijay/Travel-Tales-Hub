🌍 Travel Tales Hub

Travel Tales Hub is a web-based travel storytelling platform that allows users to share, manage, and discover exciting travel experiences. Built using React.js, Flask, and MySQL, the platform enables users to create trips, post highlights, interact via likes/comments, and manage personal profiles with ease.

🚀 Features

	👥 User Features
	
 		1.Registration & Login with secure password hashing and PIN-based verification
 
 		2.Profile Management with image upload and bio editing
 	
  		3.Trip Management: Create, edit, draft, or publish travel trips with images, dates, and details
 	
  		4.Highlight Post Module: Showcase special trips with custom images, duration, and charges
 	
  		5.Likes & Comments: Engage with others in real-time (instant UI updates, no page reload)
 	
  		6.Search Functionality: Filter posts by title in a responsive newsfeed format
 	
  		7.Notifications Module: Get notified when someone likes/comments on your posts

	🛠️ Admin Features
	
 		1.Dashboard Overview: Total users, post counts, and weekly post activity graphs
 	
  		2.Post Moderation: View, manage, or delete any user-generated content
 	
  		3.Secure Admin Panel with role-based access

🧑‍💻 Tech Stack

| Layer             | Technology             |
| ----------------- | ---------------------- |
| Frontend          | React.js, Axios, CSS   |
| Backend           | Python, Flask          |
| Database          | MySQL                  |
| Styling           | Custom CSS / Tailwind  |
| API Communication | REST APIs              |
| Authentication    | JWT + PIN Verification |


🗃️ Database Tables Used

 `user` – Stores user credentials, profile, and PIN
 
 `trips` – Records travel plans and trip metadata
 
 `posts` – Contains user-created post content
 
 `highlighted_trips` – Special feature posts with images and summary
 
 `post_trips` – Maps trip data to user posts
 
 `post_likes` – Stores all likes with user and post references
 
 `post_comments` – Tracks user comments with timestamps
 
 `notifications` – Records all post interactions like likes/comments

🧪 How to Run This Project

🖥 Backend Setup (Flask)

1. Clone the repository:

   ```Just clone the project folders as well as all the files.```

2. Navigate to the backend folder:

   ```bash
   cd backend
   ```
3. Create a virtual environment and activate it:

   ```bash
   python -m venv venv
   source venv/bin/activate    for Windows: venvScriptsactivate
   ```
4. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```
5. Run the Flask server:

   ```bash
   python app.py
   ```

🌐 Frontend Setup (React)

1. Navigate to the frontend folder:

   ```bash
   cd ../frontend
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Start the development server:

   ```bash
   npm start
   ```

📄 License

This project is developed as part of an academic or personal portfolio. Free to use for educational purposes.

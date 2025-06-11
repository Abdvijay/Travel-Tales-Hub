CREATE DATABASE travel_tales;
show databases;
use travel_tales;
show tables;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL
);
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE followers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,          -- The user who is being followed
    follower_id INT NOT NULL,      -- The user who is following
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(255) NOT NULL,
    title TEXT,
    total_days INT,
    total_charge DECIMAL(10,2),
    description TEXT,
    image_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE search_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    search_term VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE trip_likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    trip_id INT NOT NULL,
    liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

CREATE TABLE trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS token_blacklist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE post_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (post_id, user_id)
);

desc users;
desc trips;

select * from payments;
select * from users;
select * from trips;	
select * from followers;
select * from posts;
select * from highlighted_trips;
select * from post_trips;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE subscriptions;
TRUNCATE TABLE followers;
TRUNCATE TABLE token_blacklist;
TRUNCATE TABLE search_history;
TRUNCATE TABLE payments;
TRUNCATE TABLE trips;
TRUNCATE TABLE trip_likes;
TRUNCATE TABLE users;
TRUNCATE TABLE posts;
TRUNCATE TABLE highlighted_trips;
TRUNCATE TABLE post_trips;
SET FOREIGN_KEY_CHECKS = 1;


ALTER TABLE users CHANGE otp_code pin_number VARCHAR(6);
ALTER TABLE users ADD CONSTRAINT unique_username UNIQUE (username);
ALTER TABLE users 
ADD COLUMN bio TEXT DEFAULT NULL,
ADD COLUMN profile_pic VARCHAR(255) DEFAULT NULL;
ALTER TABLE trips ADD COLUMN image_filename VARCHAR(255);
ALTER TABLE trips
ADD COLUMN posted ENUM('no', 'yes') DEFAULT 'no';

SHOW GLOBAL VARIABLES LIKE 'log_error';
SET GLOBAL wait_timeout = 600;
SET GLOBAL interactive_timeout = 600;
SET GLOBAL net_read_timeout = 600;
SET GLOBAL net_write_timeout = 600;
SET GLOBAL max_allowed_packet = 1073741824;

CREATE TABLE trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255),
    trip_type VARCHAR(50),
    start_date DATE,
    end_date DATE,
    charge DECIMAL(10, 2),
    start_location VARCHAR(255),
    end_location VARCHAR(255),
    description TEXT,
    image_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE post_trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    trip_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE highlighted_trips LIKE trips;


SHOW COLUMNS FROM trips LIKE 'posted';
UPDATE trips SET posted = 'yes' WHERE user_id = 5;
SHOW COLUMNS FROM trips;
SHOW COLUMNS FROM highlighted_trips;
SHOW COLUMNS FROM post_likes;
ALTER TABLE post_trips CHANGE trip_id highlight_id INT;

CREATE TABLE post_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE post_comments ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;

select * from post_comments;
SELECT * FROM post_comments WHERE post_id = 41 ;

show tables;

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_id INT NOT NULL,
    sender_id INT NOT NULL,
    post_id INT,
    type ENUM('like', 'comment') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

select * from users;
select * from post_likes;
select * from notifications;
select * from post_trips;
select * from posts;
select * from search_history;
select * from post_comments;
SELECT user_id FROM posts where id = 41;

TRUNCATE notifications;

show tables;
show columns from users;
show columns from trips;
show columns from posts;
show columns from highlighted_trips;
show columns from post_trips;
show columns from post_likes;
show columns from post_comments;
show columns from notifications;

select role from users where username = 'admin';
update users
set role = 'admin'
where username = 'admin';
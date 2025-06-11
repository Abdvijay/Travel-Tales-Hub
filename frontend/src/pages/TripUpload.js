import { useState } from "react";
import axios from "axios";
import { getToken } from "../services/authService";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TripUpload = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!title || !description || !image) {
      toast.error("Please fill all fields and upload an image.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("image", image);

    try {
      const response = await axios.post("http://localhost:5000/upload-trip", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: getToken(),
        },
      });

      toast.success("Trip uploaded successfully!");
      setTitle("");
      setDescription("");
      setImage(null);
      setPreview(null);
    } catch (error) {
      toast.error("Error uploading trip. Please try again.");
    }
  };

  return (
    <div>
      <h2>Upload a New Trip</h2>
      <form onSubmit={handleUpload}>
        <input type="text" placeholder="Trip Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea placeholder="Trip Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {preview && <img src={preview} alt="Preview" width="200px" />}
        <button type="submit">Upload</button>
      </form>
    </div>
  );
};

export default TripUpload;
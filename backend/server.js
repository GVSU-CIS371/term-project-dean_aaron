// server.js
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // You'll need to add your Firebase credentials here

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

// Routes

// User Routes
app.post('/api/users', async (req, res) => {
  try {
    const { email, displayName, uid } = req.body;
    
    await db.collection('users').doc(uid).set({
      email,
      displayName,
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Task Routes
app.get('/api/tasks', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const tasksSnapshot = await db.collection('tasks')
      .where('userId', '==', userId)
      .get();
    
    const tasks = [];
    tasksSnapshot.forEach(doc => {
      tasks.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/tasks', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { title, description, dueDate, priority, category } = req.body;
    
    const task = {
      userId,
      title,
      description,
      dueDate,
      priority,
      category,
      status: 'Not Started',
      creationDate: admin.firestore.FieldValue.serverTimestamp(),
      lastModified: admin.firestore.FieldValue.serverTimestamp(),
      isShared: false,
      sharedWith: []
    };
    
    const docRef = await db.collection('tasks').add(task);
    
    res.status(201).json({
      id: docRef.id,
      ...task
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/tasks/:id', authenticateUser, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.uid;
    const updateData = req.body;
    
    // Ensure lastModified is updated
    updateData.lastModified = admin.firestore.FieldValue.serverTimestamp();
    
    // Verify task belongs to user
    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const taskData = taskDoc.data();
    if (taskData.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized - Task does not belong to user' });
    }
    
    await db.collection('tasks').doc(taskId).update(updateData);
    
    res.status(200).json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/tasks/:id', authenticateUser, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.uid;
    
    // Verify task belongs to user
    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const taskData = taskDoc.data();
    if (taskData.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized - Task does not belong to user' });
    }
    
    await db.collection('tasks').doc(taskId).delete();
    
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Categories Routes
app.get('/api/categories', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const categoriesSnapshot = await db.collection('categories')
      .where('userId', '==', userId)
      .get();
    
    const categories = [];
    categoriesSnapshot.forEach(doc => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/categories', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { name, color, isDefault } = req.body;
    
    const category = {
      userId,
      name,
      color,
      isDefault: isDefault || false
    };
    
    const docRef = await db.collection('categories').add(category);
    
    res.status(201).json({
      id: docRef.id,
      ...category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Shared Templates Routes
app.get('/api/templates', authenticateUser, async (req, res) => {
  try {
    const templatesSnapshot = await db.collection('sharedTemplates')
      .where('isPublic', '==', true)
      .get();
    
    const templates = [];
    templatesSnapshot.forEach(doc => {
      templates.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.status(200).json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/templates', authenticateUser, async (req, res) => {
  try {
    const creatorId = req.user.uid;
    const { title, description, tasks, isPublic } = req.body;
    
    const template = {
      creatorId,
      title,
      description,
      tasks,
      isPublic: isPublic || false,
      downloadCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('sharedTemplates').add(template);
    
    res.status(201).json({
      id: docRef.id,
      ...template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Shared tasks
app.post('/api/tasks/:id/share', authenticateUser, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.uid;
    const { shareWithEmails } = req.body;
    
    // Verify task belongs to user
    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const taskData = taskDoc.data();
    if (taskData.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized - Task does not belong to user' });
    }
    
    // Get user IDs from emails
    const sharedWithIds = [];
    for (const email of shareWithEmails) {
      const userQuery = await db.collection('users').where('email', '==', email).get();
      if (!userQuery.empty) {
        userQuery.forEach(doc => {
          sharedWithIds.push(doc.id);
        });
      }
    }
    
    // Check if there are any shared IDs before updating
    if (sharedWithIds.length > 0) {
        await db.collection('tasks').doc(taskId).update({
        isShared: true,
        sharedWith: admin.firestore.FieldValue.arrayUnion(...sharedWithIds),
        lastModified: admin.firestore.FieldValue.serverTimestamp()
        });
    } else {
        // Just update the isShared flag if no IDs to add
        await db.collection('tasks').doc(taskId).update({
        isShared: true,
        lastModified: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    
    res.status(200).json({ message: 'Task shared successfully' });
  } catch (error) {
    console.error('Error sharing task:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
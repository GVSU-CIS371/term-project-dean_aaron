<template>
  <div class="task-manager">
    <header>
      <h1>Personal Task Manager</h1>
      <div class="user-section" v-if="user">
        <span>{{ user.displayName }}</span>
        <button @click="logout" class="btn btn-sm">Logout</button>
      </div>
      <div v-else>
        <button @click="showLoginForm = true" class="btn">Login</button>
        <button @click="showRegisterForm = true" class="btn btn-primary">Register</button>
      </div>
    </header>

    <!-- Login Form -->
    <div class="modal" v-if="showLoginForm">
      <div class="modal-content">
        <h2>Login</h2>
        <form @submit.prevent="login">
          <div class="form-group">
            <label>Email:</label>
            <input type="email" v-model="loginForm.email" required>
          </div>
          <div class="form-group">
            <label>Password:</label>
            <input type="password" v-model="loginForm.password" required>
          </div>
          <div class="form-actions">
            <button type="button" @click="showLoginForm = false" class="btn">Cancel</button>
            <button type="submit" class="btn btn-primary">Login</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Register Form -->
    <div class="modal" v-if="showRegisterForm">
      <div class="modal-content">
        <h2>Register</h2>
        <form @submit.prevent="register">
          <div class="form-group">
            <label>Display Name:</label>
            <input type="text" v-model="registerForm.displayName" required>
          </div>
          <div class="form-group">
            <label>Email:</label>
            <input type="email" v-model="registerForm.email" required>
          </div>
          <div class="form-group">
            <label>Password:</label>
            <input type="password" v-model="registerForm.password" required minlength="6">
          </div>
          <div class="form-actions">
            <button type="button" @click="showRegisterForm = false" class="btn">Cancel</button>
            <button type="submit" class="btn btn-primary">Register</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Main Content (visible when logged in) -->
    <main v-if="user">
      <div class="dashboard">
        <div class="sidebar">
          <div class="categories">
            <h3>Categories</h3>
            <ul>
              <!-- Add "All Categories" option -->
              <li 
                @click="filterByCategory(null, true)"
                :class="{ active: selectedCategory === null && !uncategorizedOnly }"
                style="borderLeft: 4px solid #95a5a6;"
              >
                All Categories
              </li>
              <!-- Add "Uncategorized" option -->
              <li 
                @click="filterByCategory(null, false)"
                :class="{ active: selectedCategory === null && uncategorizedOnly }"
                style="borderLeft: 4px solid #95a5a6;"
              >
                Uncategorized
              </li>
              <li 
                v-for="category in categories" 
                :key="category.id" 
                @click="filterByCategory(category.id, false)"
                :class="{ active: selectedCategory === category.id }"
                :style="{ borderLeft: `4px solid ${category.color}` }"
              >
                {{ category.name }}
              </li>
              <li class="add-category" @click="showCategoryForm = true">+ Add Category</li>
            </ul>
          </div>
          
          <div class="filters">
            <h3>Filters</h3>
            <ul>
              <li 
                @click="filterByStatus('all')"
                :class="{ active: statusFilter === 'all' }"
              >
                All Tasks
              </li>
              <li 
                @click="filterByStatus('Not Started')"
                :class="{ active: statusFilter === 'Not Started' }"
              >
                Not Started
              </li>
              <li 
                @click="filterByStatus('In Progress')"
                :class="{ active: statusFilter === 'In Progress' }"
              >
                In Progress
              </li>
              <li 
                @click="filterByStatus('Completed')"
                :class="{ active: statusFilter === 'Completed' }"
              >
                Completed
              </li>
            </ul>
          </div>
          
          <div class="templates">
            <h3>Templates</h3>
            <ul>
              <li v-for="template in templates" :key="template.id" @click="useTemplate(template)">
                {{ template.title }}
              </li>
              <li class="add-template" @click="showTemplateForm = true">+ Create Template</li>
            </ul>
          </div>
        </div>
        
        <div class="content">
          <div class="controls">
            <button @click="showTaskForm = true" class="btn btn-primary">+ Add Task</button>
            <div class="sort-controls">
              <label>Sort by:</label>
              <select v-model="sortBy" @change="sortTasks">
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
                <option value="creationDate">Creation Date</option>
              </select>
            </div>
          </div>
          
          <div class="tasks-container">
            <div 
              v-for="task in filteredTasks" 
              :key="task.id" 
              class="task-card"
              :class="{ 
                'priority-high': task.priority === 'High',
                'priority-medium': task.priority === 'Medium',
                'priority-low': task.priority === 'Low',
                'status-completed': task.status === 'Completed'
              }"
            >
              <div class="task-header">
                <h3>{{ task.title }}</h3>
                <div class="task-actions">
                  <button v-if="task.isOwner" @click="editTask(task)" class="btn-icon">✏️</button>
                  <button v-if="task.isOwner" @click="deleteTask(task.id)" class="btn-icon">🗑️</button>
                  <button 
                    v-if="task.isOwner"
                    @click="showShareTaskForm = true; taskToShare = task" 
                    class="btn-icon"
                    :class="{ 'shared': task.isShared }"
                  >
                    🔗
                  </button>
                </div>
              </div>
              <p class="task-description">{{ task.description }}</p>
              <div class="task-footer">
                <div class="task-meta">
                  <span class="task-due-date">Due: {{ formatDate(task.dueDate) }}</span>
                  <span class="task-priority">{{ task.priority }}</span>
                </div>
                <div class="task-status">
                  <select v-model="task.status" @change="updateTaskStatus(task)">
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div v-if="filteredTasks.length === 0" class="no-tasks">
              <p>No tasks to display. Add a new task to get started!</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Add/Edit Task Form -->
      <div class="modal" v-if="showTaskForm">
        <div class="modal-content">
          <h2>{{ editingTask ? 'Edit Task' : 'Add New Task' }}</h2>
          <form @submit.prevent="saveTask">
            <div class="form-group">
              <label>Title:</label>
              <input type="text" v-model="taskForm.title" required>
            </div>
            <div class="form-group">
              <label>Description:</label>
              <textarea v-model="taskForm.description" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Due Date:</label>
              <input type="date" v-model="taskForm.dueDate" required>
            </div>
            <div class="form-group">
              <label>Priority:</label>
              <select v-model="taskForm.priority">
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div class="form-group">
              <label>Category:</label>
              <select v-model="taskForm.category">
                <!-- Add option for no category -->
                <option value="">No Category</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
            <div class="form-group" v-if="editingTask">
              <label>Status:</label>
              <select v-model="taskForm.status">
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" @click="showTaskForm = false" class="btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Save</button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Add Category Form -->
      <div class="modal" v-if="showCategoryForm">
        <div class="modal-content">
          <h2>Add Category</h2>
          <form @submit.prevent="saveCategory">
            <div class="form-group">
              <label>Name:</label>
              <input type="text" v-model="categoryForm.name" required>
            </div>
            <div class="form-group">
              <label>Color:</label>
              <input type="color" v-model="categoryForm.color">
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" v-model="categoryForm.isDefault">
                Set as default
              </label>
            </div>
            <div class="form-actions">
              <button type="button" @click="showCategoryForm = false" class="btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Save</button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Create Template Form -->
      <div class="modal" v-if="showTemplateForm">
        <div class="modal-content">
          <h2>Create Template</h2>
          <form @submit.prevent="saveTemplate">
            <div class="form-group">
              <label>Title:</label>
              <input type="text" v-model="templateForm.title" required>
            </div>
            <div class="form-group">
              <label>Description:</label>
              <textarea v-model="templateForm.description" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Include Tasks:</label>
              <div class="template-tasks-selection">
                <div 
                  v-for="task in tasks" 
                  :key="task.id" 
                  class="template-task-item"
                >
                  <label>
                    <input type="checkbox" v-model="templateForm.selectedTasks" :value="task.id">
                    {{ task.title }}
                  </label>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" v-model="templateForm.isPublic">
                Make template public
              </label>
            </div>
            <div class="form-actions">
              <button type="button" @click="showTemplateForm = false" class="btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Save</button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Share Task Form -->
      <div class="modal" v-if="showShareTaskForm">
        <div class="modal-content">
          <h2>Share Task</h2>
          <form @submit.prevent="shareTask">
            <div class="form-group">
              <label>Share with (emails, comma separated):</label>
              <input type="text" v-model="shareTaskForm.emails" placeholder="user1@example.com, user2@example.com">
            </div>
            <div class="form-actions">
              <button type="button" @click="showShareTaskForm = false" class="btn">Cancel</button>
              <button type="submit" class="btn btn-primary">Share</button>
            </div>
          </form>
        </div>
      </div>
    </main>
    
    <!-- Landing Page (visible when not logged in) -->
    <div class="landing-page" v-if="!user">
      <h2>Welcome to Personal Task Manager</h2>
      <p>Organize your tasks, collaborate with others, and boost your productivity!</p>
      <div class="cta-buttons">
        <button @click="showLoginForm = true" class="btn btn-lg">Login</button>
        <button @click="showRegisterForm = true" class="btn btn-primary btn-lg">Get Started</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile 
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { db } from './firebase';
import axios from 'axios';

export default {
  name: 'TaskManager',
  setup() {
    // Firebase config - replace with your own
    const firebaseConfig = {
        apiKey: "AIzaSyDuQ5U_jvbDYwHIyvGGlIso09Vc9jnMoWU",
        authDomain: "termproject-89a0d.firebaseapp.com",
        projectId: "termproject-89a0d",
        storageBucket: "termproject-89a0d.firebasestorage.app",
        messagingSenderId: "718048077031",
        appId: "1:718048077031:web:0746e272b7399ac2bdee42"
      };
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    
    // Backend API URL
    const apiUrl = ref('http://localhost:3000/api');
    
    // State
    const user = ref(null);
    const authToken = ref(null);
    const tasks = ref([]);
    const categories = ref([]);
    const templates = ref([]);
    
    // UI state
    const showLoginForm = ref(false);
    const showRegisterForm = ref(false);
    const showTaskForm = ref(false);
    const showCategoryForm = ref(false);
    const showTemplateForm = ref(false);
    const showShareTaskForm = ref(false);
    
    // Forms
    const loginForm = ref({
      email: '',
      password: ''
    });
    
    const registerForm = ref({
      displayName: '',
      email: '',
      password: ''
    });
    
    const taskForm = ref({
      title: '',
      description: '',
      dueDate: '',
      priority: 'Medium',
      category: ''
    });
    
    const categoryForm = ref({
      name: '',
      color: '#3498db',
      isDefault: false
    });
    
    const templateForm = ref({
      title: '',
      description: '',
      selectedTasks: [],
      isPublic: false
    });
    
    const shareTaskForm = ref({
      emails: ''
    });
    
    // State
    const editingTask = ref(null);
    const taskToShare = ref(null);
    const selectedCategory = ref(null);
    const uncategorizedOnly = ref(false);
    const statusFilter = ref('all');
    const sortBy = ref('dueDate');
    
    // Computed properties
    const filteredTasks = computed(() => {
      let result = [...tasks.value];
      
      // Filter by category
      if (selectedCategory.value) {
        // Filter by a specific category
        result = result.filter(task => task.category === selectedCategory.value);
      } else if (uncategorizedOnly.value) {
        // Filter to show only uncategorized tasks
        result = result.filter(task => !task.category || task.category === '');
      }
      // If neither condition is true, show all tasks (no category filtering)
      
      // Filter by status
      if (statusFilter.value !== 'all') {
        result = result.filter(task => task.status === statusFilter.value);
      }
      
      // Sort tasks
      if (sortBy.value === 'dueDate') {
        result.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      } else if (sortBy.value === 'priority') {
        const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
        result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      } else if (sortBy.value === 'creationDate') {
        result.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate));
      }
      
      return result;
    });
    
    // Functions
    // Authentication methods
    const register = async () => {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          registerForm.value.email,
          registerForm.value.password
        );
        
        // Update user profile with display name
        await updateProfile(userCredential.user, {
          displayName: registerForm.value.displayName
        });
        
        // Create user in backend
        await axios.post(`${apiUrl.value}/users`, {
          uid: userCredential.user.uid,
          email: registerForm.value.email,
          displayName: registerForm.value.displayName
        });
        
        showRegisterForm.value = false;
        registerForm.value = { displayName: '', email: '', password: '' };
      } catch (error) {
        console.error('Registration error:', error);
        alert(`Registration failed: ${error.message}`);
      }
    };
    
    const login = async () => {
      try {
        await signInWithEmailAndPassword(
          auth,
          loginForm.value.email,
          loginForm.value.password
        );
        
        showLoginForm.value = false;
        loginForm.value = { email: '', password: '' };
      } catch (error) {
        console.error('Login error:', error);
        alert(`Login failed: ${error.message}`);
      }
    };
    
    const logout = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Logout error:', error);
      }
    };
    
    // Data fetching
    const fetchData = async () => {
      await Promise.all([
        fetchTasks(),
        fetchCategories(),
        fetchTemplates()
      ]);
    };
    
    const fetchTasks = async () => {
      try {
        const response = await axios.get(`${apiUrl.value}/tasks`, {
          headers: { Authorization: `Bearer ${authToken.value}` }
        });
        tasks.value = response.data;
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };
    
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${apiUrl.value}/categories`, {
          headers: { Authorization: `Bearer ${authToken.value}` }
        });
        categories.value = response.data;
        
        // If no category selected and we have categories, select the first or default one
        if (selectedCategory.value === null && uncategorizedOnly.value === false && categories.value.length > 0) {
          const defaultCategory = categories.value.find(c => c.isDefault) || categories.value[0];
          selectedCategory.value = defaultCategory.id;
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    const fetchTemplates = async () => {
      try {
        const response = await axios.get(`${apiUrl.value}/templates`, {
          headers: { Authorization: `Bearer ${authToken.value}` }
        });
        templates.value = response.data;
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };
    
    // Task methods
    const editTask = (task) => {
      editingTask.value = task;
      taskForm.value = {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        category: task.category || '',  // Handle null/undefined category
        status: task.status
      };
      showTaskForm.value = true;
    };
    
    const saveTask = async () => {
      try {
        if (editingTask.value) {
          // Update existing task
          await axios.put(
            `${apiUrl.value}/tasks/${editingTask.value.id}`, 
            taskForm.value,
            { headers: { Authorization: `Bearer ${authToken.value}` } }
          );
        } else {
          // Create new task
          await axios.post(
            `${apiUrl.value}/tasks`, 
            taskForm.value,
            { headers: { Authorization: `Bearer ${authToken.value}` } }
          );
        }
        
        // Reset and refresh
        showTaskForm.value = false;
        taskForm.value = {
          title: '',
          description: '',
          dueDate: '',
          priority: 'Medium',
          category: selectedCategory.value || '' // Set to selected category or empty string
        };
        editingTask.value = null;
        await fetchTasks();
      } catch (error) {
        console.error('Error saving task:', error);
        alert('Failed to save task. Please try again.');
      }
    };
    
    const deleteTask = async (taskId) => {
      if (confirm('Are you sure you want to delete this task?')) {
        try {
          await axios.delete(`${apiUrl.value}/tasks/${taskId}`, {
            headers: { Authorization: `Bearer ${authToken.value}` }
          });
          await fetchTasks();
        } catch (error) {
          console.error('Error deleting task:', error);
          alert('Failed to delete task. Please try again.');
        }
      }
    };
    
    const updateTaskStatus = async (task) => {
      try {
        await axios.put(
          `${apiUrl.value}/tasks/${task.id}`,
          { status: task.status },
          { headers: { Authorization: `Bearer ${authToken.value}` } }
        );
      } catch (error) {
        console.error('Error updating task status:', error);
        alert('Failed to update task status. Please try again.');
        await fetchTasks(); // Refresh to get the original state
      }
    };
    
    // Category methods
    const saveCategory = async () => {
      try {
        await axios.post(
          `${apiUrl.value}/categories`,
          categoryForm.value,
          { headers: { Authorization: `Bearer ${authToken.value}` } }
        );
        
        // Reset and refresh
        showCategoryForm.value = false;
        categoryForm.value = {
          name: '',
          color: '#3498db',
          isDefault: false
        };
        await fetchCategories();
      } catch (error) {
        console.error('Error saving category:', error);
        alert('Failed to save category. Please try again.');
      }
    };
    
    // Template methods
    const saveTemplate = async () => {
      try {
        // Prepare tasks for the template
        const templateTasks = tasks.value
          .filter(task => templateForm.value.selectedTasks.includes(task.id))
          .map(task => ({
            title: task.title,
            description: task.description,
            priority: task.priority,
            category: task.category
          }));
        
        await axios.post(
          `${apiUrl.value}/templates`,
          {
            title: templateForm.value.title,
            description: templateForm.value.description,
            tasks: templateTasks,
            isPublic: templateForm.value.isPublic
          },
          { headers: { Authorization: `Bearer ${authToken.value}` } }
        );
        
        // Reset and refresh
        showTemplateForm.value = false;
        templateForm.value = {
          title: '',
          description: '',
          selectedTasks: [],
          isPublic: false
        };
        await fetchTemplates();
      } catch (error) {
        console.error('Error creating template:', error);
        alert('Failed to create template. Please try again.');
      }
    };
    
    const useTemplate = async (template) => {
      // Create tasks from the template
      try {
        for (const taskTemplate of template.tasks) {
          await axios.post(
            `${apiUrl.value}/tasks`,
            {
              ...taskTemplate,
              dueDate: getDefaultDueDate() // Set a default due date
            },
            { headers: { Authorization: `Bearer ${authToken.value}` } }
          );
        }
        
        await fetchTasks();
        alert(`Template "${template.title}" applied successfully!`);
      } catch (error) {
        console.error('Error applying template:', error);
        alert('Failed to apply template. Please try again.');
      }
    };
    
    // Share task
    const shareTask = async () => {
      try {
        const emailsArray = shareTaskForm.value.emails
          .split(',')
          .map(email => email.trim())
          .filter(email => email);
        
        if (emailsArray.length === 0) {
          alert('Please enter at least one email address.');
          return;
        }
        
        await axios.post(
          `${apiUrl.value}/tasks/${taskToShare.value.id}/share`,
          { shareWithEmails: emailsArray },
          { headers: { Authorization: `Bearer ${authToken.value}` } }
        );
        
        // Reset and refresh
        showShareTaskForm.value = false;
        shareTaskForm.value = { emails: '' };
        taskToShare.value = null;
        await fetchTasks();
        alert('Task shared successfully!');
      } catch (error) {
        console.error('Error sharing task:', error);
        alert('Failed to share task. Please try again.');
      }
    };
    
    // Filter and sort - modified to handle uncategorized tasks
    const filterByCategory = (categoryId, showAll) => {
      if (showAll) {
        // Show all tasks
        selectedCategory.value = null;
        uncategorizedOnly.value = false;
      } else if (categoryId === null) {
        // Show uncategorized tasks only
        selectedCategory.value = null;
        uncategorizedOnly.value = true;
      } else {
        // Show tasks for a specific category
        selectedCategory.value = categoryId;
        uncategorizedOnly.value = false;
      }
    };
    
    const filterByStatus = (status) => {
      statusFilter.value = status;
    };
    
    const sortTasks = () => {
      // The actual sorting is done in the computed property
    };
    
    // Utility methods
    const formatDate = (dateString) => {
      if (!dateString) return 'No due date';
      
      const date = new Date(dateString);
      return date.toLocaleDateString();
    };
    
    const getDefaultDueDate = () => {
      const date = new Date();
      date.setDate(date.getDate() + 7); // Default due date: one week from now
      return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    };
    
    // Listen for auth state changes
    onMounted(() => {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        user.value = currentUser;
        if (currentUser) {
          currentUser.getIdToken().then(token => {
            authToken.value = token;
            fetchData();
          });
        } else {
          user.value = null;
          authToken.value = null;
          tasks.value = [];
          categories.value = [];
          templates.value = [];
        }
      });
      
      // Clean up the listener when component unmounts
      return () => unsubscribe();
    });
    
    return {
      // State
      user,
      tasks,
      categories,
      templates,
      filteredTasks,
      
      // UI state
      showLoginForm,
      showRegisterForm,
      showTaskForm,
      showCategoryForm,
      showTemplateForm,
      showShareTaskForm,
      
      // Forms
      loginForm,
      registerForm,
      taskForm,
      categoryForm,
      templateForm,
      shareTaskForm,
      
      // Task state
      editingTask,
      taskToShare,
      selectedCategory,
      uncategorizedOnly,
      statusFilter,
      sortBy,
      
      // Methods
      register,
      login,
      logout,
      fetchData,
      editTask,
      saveTask,
      deleteTask,
      updateTaskStatus,
      saveCategory,
      saveTemplate,
      useTemplate,
      shareTask,
      filterByCategory,
      filterByStatus,
      sortTasks,
      formatDate
    };
  }
};
</script>

<style>
/* Reset and base styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f7fa;
}

.task-manager {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Header styles */
header {
  background-color: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

header h1 {
  font-size: 1.5rem;
  font-weight: 600;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Button styles */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s, transform 0.1s;
  background-color: #ecf0f1;
  color: #2c3e50;
}

.btn:hover {
  background-color: #dfe4ea;
  transform: translateY(-1px);
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.btn-sm {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

.shared {
  color: #3498db;
}

/* Dashboard layout */
.dashboard {
  display: flex;
  flex: 1;
}

.sidebar {
  width: 250px;
  background-color: white;
  border-right: 1px solid #e0e0e0;
  padding: 1.5rem 0;
}

.content {
  flex: 1;
  padding: 1.5rem;
}

/* Sidebar components */
.sidebar h3 {
  font-size: 0.9rem;
  text-transform: uppercase;
  color: #7f8c8d;
  padding: 0 1.5rem;
  margin-bottom: 0.5rem;
}

.sidebar ul {
  list-style: none;
  margin-bottom: 2rem;
}

.sidebar li {
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.sidebar li:hover {
  background-color: #f5f7fa;
}

.sidebar li.active {
  background-color: #ecf0f1;
  font-weight: 500;
}

.sidebar li.add-category,
.sidebar li.add-template {
  color: #3498db;
  font-size: 0.9rem;
}

/* Controls section */
.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sort-controls select {
  padding: 0.4rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* Tasks container */
.tasks-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Task card */
.task-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  position: relative;
  border-top: 3px solid #95a5a6; /* Default color */
}

.task-card.priority-high {
  border-top-color: #e74c3c;
}

.task-card.priority-medium {
  border-top-color: #f39c12;
}

.task-card.priority-low {
  border-top-color: #2ecc71;
}

.task-card.status-completed {
  opacity: 0.7;
}

.task-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.task-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-right: 1rem;
  word-break: break-word;
}

.task-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.task-description {
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #555;
  flex: 1;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.task-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.task-due-date {
  color: #7f8c8d;
}

.task-priority {
  display: inline-block;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: #ecf0f1;
}

.priority-high .task-priority {
  background-color: #fde2e0;
  color: #c0392b;
}

.priority-medium .task-priority {
  background-color: #fef2d9;
  color: #d35400;
}

.priority-low .task-priority {
  background-color: #d5f5e3;
  color: #27ae60;
}

.task-status select {
  padding: 0.3rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.8rem;
}

.no-tasks {
  grid-column: 1 / -1;
  text-align: center;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  color: #7f8c8d;
}

/* Modal styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  padding: 2rem;
}

.modal-content h2 {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  font-weight: 600;
}

/* Form styles */
.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="password"],
.form-group input[type="date"],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.template-tasks-selection {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem;
}

.template-task-item {
  padding: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.template-task-item:last-child {
  border-bottom: none;
}

/* Landing page */
.landing-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex: 1;
  padding: 2rem;
}

.landing-page h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
}

.landing-page p {
  font-size: 1.2rem;
  color: #7f8c8d;
  margin-bottom: 2rem;
  max-width: 600px;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
}

</style>
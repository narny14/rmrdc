
// src/api/client.js

const API_BASE_URL = 'https://byteatomeneons.com/rmcf';

// Lire correctement les réponses du serveur
const readJson = async (response) => {
  const raw = await response.text();

  console.log('[RMRDC API] HTTP:', response.status);
  console.log('[RMRDC API] Réponse:', raw);

  if (!raw || !raw.trim()) {
    throw new Error(
      `Réponse vide du serveur (HTTP ${response.status})`
    );
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Réponse JSON invalide (HTTP ${response.status}): ${raw.substring(0, 200)}`
    );
  }
};

export const apiClient = {

  // =============================================
  // CONNEXION UTILISATEUR
  // =============================================

  login: async (email, password) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/apis/login.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data = await readJson(response);

      if (!response.ok || !data.success) {  
        return {
          success: false,
          message: data.message || 'Connexion impossible',
        };
      }

      return data;

    } catch (error) {
      console.error('[RMRDC LOGIN ERROR]', error.message);

      return {
        success: false,
        message: error.message || 'Erreur de connexion au serveur',
      };
    }
  },

  // =============================================
  // ACTUALITÉS MARCA + AS
  // =============================================

  getNews: async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/newsapi.php`
      );

      return await readJson(response);

    } catch (error) {
      console.error('Erreur API News:', error.message);
      return {
        success: false,
        articles: [],
      };
    }
  },

  // =============================================
  // RÉCUPÉRER LES POSTS
  // =============================================

  getFeed: async (offset = 0, limit = 10, token = null) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/posts/get_posts.php?offset=${offset}&limit=${limit}`,
        {
          headers: {
            Accept: 'application/json',
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
        }
      );

      return await readJson(response);

    } catch (error) {
      console.error('Erreur API Feed:', error.message);

      return {
        success: false,
        posts: [],
      };
    }
  },

  // =============================================
  // PUBLIER UN POST
  // =============================================

  createPost: async (userId, imageUri, caption, token = null) => {
    const formData = new FormData();

    formData.append('user_id', String(userId));
    formData.append('caption', caption);

    if (imageUri) {
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      });
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/posts/create_post.php`,
        {
          method: 'POST',
          body: formData,
          headers: {
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
        }
      );

      return await readJson(response);

    } catch (error) {
      console.error('Erreur création post:', error.message);

      return {
        success: false,
        message: error.message,
      };
    }
  },

  // =============================================
  // LIKER / UNLIKER UN POST
  // =============================================

  toggleLike: async (userId, postId, token = null) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/posts/like_post.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
          body: JSON.stringify({
            user_id: userId,
            post_id: postId,
          }),
        }
      );

      return await readJson(response);

    } catch (error) {
      console.error('Erreur like:', error.message);

      return {
        success: false,
        message: error.message,
      };
    }
  },
};

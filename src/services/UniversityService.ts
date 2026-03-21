import axios from 'axios';

export interface UniCourse {
  id: number;
  fullname: string;
  shortname: string;
  summary?: string;
}

export interface UniLesson {
  id: number;
  name: string;
  summary?: string;
  modules: {
    id: number;
    name: string;
    modname: string; // 'resource', 'video', etc.
    fileurl?: string;
  }[];
}

export const getAuthUrl = async (): Promise<string> => {
  const response = await axios.get('/api/auth/university/url');
  return response.data.url;
};

export const getCourses = async (): Promise<UniCourse[]> => {
  const response = await axios.get('/api/university/courses');
  return response.data;
};

export const getLessons = async (courseId: number): Promise<UniLesson[]> => {
  const response = await axios.get('/api/university/lessons/' + courseId);
  return response.data;
};

export const downloadLessonFile = async (fileUrl: string): Promise<File> => {
  // We proxy the download to bypass CORS if needed
  const response = await axios.get(fileUrl, {
    responseType: 'blob',
  });
  
  const fileName = fileUrl.split('/').pop() || 'lesson_video.mp4';
  return new File([response.data], fileName, { type: response.data.type });
};

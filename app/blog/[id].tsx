// import { useState, useEffect } from 'react';
// import { StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
// import { View, Text } from '@/components/Themed';
// import { useLocalSearchParams, useNavigation } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import { TouchableOpacity } from 'react-native-gesture-handler';
// import Colors from '@/constants/Colors';
// import { useColorScheme } from '@/hooks/useColorScheme';

// // Blog service to fetch data
// import { getBlogById } from '@/services/blogService';

// export default function BlogDetailScreen() {
//   const { id } = useLocalSearchParams();
//   const colorScheme = useColorScheme();
//   const navigation = useNavigation();
//   const [blog, setBlog] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [bookmarked, setBookmarked] = useState(false);

//   useEffect(() => {
//     loadBlog();
//   }, [id]);

//   // Set up header right button
//   useEffect(() => {
//     navigation.setOptions({
//       headerRight: () => (
//         <TouchableOpacity 
//           style={styles.headerButton} 
//           onPress={() => setBookmarked(!bookmarked)}
//         >
//           <Ionicons 
//             name={bookmarked ? "bookmark" : "bookmark-outline"} 
//             size={24} 
//             color={Colors[colorScheme ?? 'light'].text} 
//           />
//         </TouchableOpacity>
//       ),
//     });
//   }, [navigation, bookmarked, colorScheme]);

//   const loadBlog = async () => {
//     try {
//       // In a real app, fetch from API using id
//       const data = await getBlogById(id as string);
//       setBlog(data);
//     } catch (error) {
//       console.error('Failed to load blog:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
//       </View>
//     );
//   }

//   if (!blog) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.errorText}>Blog not found</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView style={styles.container}>
//       <View style={styles.imageContainer}>
//         {blog.coverImage && (
//           <Image source={{ uri: blog.coverImage }} style={styles.coverImage} />
//         )}
//       </View>
      
//       <View style={styles.contentContainer}>
//         <Text style={styles.title}>{blog.title}</Text>
        
//         <View style={styles.metaContainer}>
//           <Text style={styles.author}>{blog.author}</Text>
//           <Text style={styles.date}>{new Date(blog.publishedAt).toLocaleDateString()}</Text>
//         </View>
        
//         {blog.tags && blog.tags.length > 0 && (
//           <View style={styles.tagsContainer}>
//             {blog.tags.map((tag, index) => (
//               <TouchableOpacity 
//                 key={index} 
//                 style={[styles.tagButton, {backgroundColor: Colors[colorScheme ?? 'light'].tint + '20'}]}
//                 onPress={() => router.push(`/blog/tag/${tag}`)}
//               >
//                 <Text style={[styles.tagText, {color: Colors[colorScheme ?? 'light'].tint}]}>#{tag}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         )}
        
//         <Text style={styles.content}>{blog.content}</Text>
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   errorText: {
//     fontSize: 18,
//     textAlign: 'center',
//     margin: 20,
//   },
//   imageContainer: {
//     width: '100%',
//     height: 250,
//     backgroundColor: '#f0f0f0',
//   },
//   coverImage: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   contentContainer: {
//     padding: 16,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 12,
//   },
//   metaContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 16,
//   },
//   author: {
//     fontSize: 14,
//     color: '#666',
//   },
//   date: {
//     fontSize: 14,
//     color: '#666',
//   },
//   tagsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     marginBottom: 16,
//   },
//   tagButton: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//     marginRight: 8,
//     marginBottom: 8,
//   },
//   tagText: {
//     fontSize: 12,
//   },
//   content: {
//     fontSize: 16,
//     lineHeight: 24,
//   },
//   headerButton: {
//     padding: 8,
//   },
// });
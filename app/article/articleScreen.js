import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    ScrollView,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Sizes, CommonStyles } from '../../constants/styles';
import { useAuth } from '../context/AuthContext';
import { Image as ExpoImage } from 'expo-image';
import sozoWhiteLogo from '../../assets/images/sozo-white.png';
import worshipLogo from '../../assets/images/worship_anywhere.png';

const { width } = Dimensions.get('window');

const ArticleScreen = React.memo(() => {
    const navigation = useNavigation();
    const params = useLocalSearchParams();
    const { user } = useAuth();

    const [state, setState] = useState({
        article: null,
        loading: true,
        refreshing: false,
        articleData: null,
    });

    const updateState = useCallback((data) => setState((state) => ({ ...state, ...data })), []);

    // Helper function to extract text from rich text nodes
    // API supports various node types including:
    // - PARAGRAPH: Contains text nodes with paragraph formatting
    // - TEXT: Contains actual text content with decorations
    // - HEADING: Contains heading text with levels
    // - BULLETED_LIST/NUMBERED_LIST: Contains list items
    // - ORDERED_LIST: Contains numbered list items (Bible readings)
    // 
    // Decorations include:
    // - BOLD: Bold text formatting
    // - ITALIC: Italic text formatting  
    // - UNDERLINE: Underlined text formatting
    // - COLOR: Text color formatting
    // - LINK: Link formatting (Bible readings)
    const extractTextFromNodes = useCallback((nodes) => {
        if (!nodes || !Array.isArray(nodes)) return '';
        
        return nodes.map(node => {
            if (node.type === 'TEXT' && node.textData && node.textData.text) {
                let nodeText = node.textData.text;
                
                // Handle text decorations (bold, italic, etc.)
                if (node.textData.decorations && Array.isArray(node.textData.decorations)) {
                    const hasBold = node.textData.decorations.some(decoration => decoration.type === 'BOLD');
                    const hasItalic = node.textData.decorations.some(decoration => decoration.type === 'ITALIC');
                    const hasUnderline = node.textData.decorations.some(decoration => decoration.type === 'UNDERLINE');
                    const hasLink = node.textData.decorations.find(decoration => decoration.type === 'LINK');
                    
                    if (hasBold) {
                        nodeText = `**${nodeText}**`;
                    }
                    if (hasItalic) {
                        nodeText = `*${nodeText}*`;
                    }
                    if (hasUnderline) {
                        nodeText = `_${nodeText}_`;
                    }
                    if (hasLink && hasLink.linkData && hasLink.linkData.url) {
                        // Format as markdown link for now, could be enhanced later
                        nodeText = `[${nodeText}](${hasLink.linkData.url})`;
                    }
                }
                
                return nodeText;
            } else if (node.type === 'text') {
                return node.text || '';
            } else if (node.type === 'paragraph' || node.type === 'PARAGRAPH') {
                // Handle both paragraph formats
                if (node.children && Array.isArray(node.children)) {
                    return '\n\n' + extractTextFromNodes(node.children);
                } else if (node.nodes && Array.isArray(node.nodes)) {
                    return '\n\n' + extractTextFromNodes(node.nodes);
                }
                return '';
            } else if (node.type === 'heading' || node.type === 'HEADING') {
                const level = node.level || 1;
                const headingPrefix = '#'.repeat(level);
                if (node.children && Array.isArray(node.children)) {
                    return '\n\n' + headingPrefix + ' ' + extractTextFromNodes(node.children);
                } else if (node.nodes && Array.isArray(node.nodes)) {
                    return '\n\n' + headingPrefix + ' ' + extractTextFromNodes(node.nodes);
                }
                return '';
            } else if (node.type === 'list') {
                return '\n\n' + extractTextFromNodes(node.children || []);
            } else if (node.type === 'listItem') {
                return '\n• ' + extractTextFromNodes(node.children || []);
            } else if (node.type === 'ORDERED_LIST') {
                // Handle ordered lists (numbered lists)
                if (node.nodes && Array.isArray(node.nodes)) {
                    return '\n\n' + node.nodes.map((listItem, index) => {
                        const itemText = extractTextFromNodes(listItem.nodes || []);
                        return `${index + 1}. ${itemText}`;
                    }).join('\n');
                }
                return '';
            } else if (node.type === 'strong') {
                return '**' + extractTextFromNodes(node.children || []) + '**';
            } else if (node.type === 'emphasis') {
                return '*' + extractTextFromNodes(node.children || []) + '*';
            } else if (node.children && Array.isArray(node.children)) {
                return extractTextFromNodes(node.children);
            } else if (node.nodes && Array.isArray(node.nodes)) {
                return extractTextFromNodes(node.nodes);
            }
            return '';
        }).join('');
    }, []);

    // Helper function to parse formatted text (bold, italic, underline)
    const parseFormattedText = useCallback((text) => {
        const elements = [];
        let currentIndex = 0;
        let elementKey = 0;
        
        // Process the text character by character to handle nested formatting
        while (currentIndex < text.length) {
            // Check for markdown links [text](url)
            if (text.charAt(currentIndex) === '[') {
                const textEnd = text.indexOf(']', currentIndex);
                if (textEnd !== -1 && text.charAt(textEnd + 1) === '(') {
                    const urlEnd = text.indexOf(')', textEnd + 2);
                    if (urlEnd !== -1) {
                        const linkText = text.substring(currentIndex + 1, textEnd);
                        const linkUrl = text.substring(textEnd + 2, urlEnd);
                        elements.push(
                            <Text key={elementKey++} style={styles.linkText}>
                                {linkText}
                            </Text>
                        );
                        currentIndex = urlEnd + 1;
                        continue;
                    }
                }
            }
            
            // Check for bold text **text**
            if (text.substring(currentIndex, currentIndex + 2) === '**') {
                const endIndex = text.indexOf('**', currentIndex + 2);
                if (endIndex !== -1) {
                    const boldText = text.substring(currentIndex + 2, endIndex);
                    elements.push(
                        <Text key={elementKey++} style={styles.boldText}>
                            {boldText}
                        </Text>
                    );
                    currentIndex = endIndex + 2;
                    continue;
                }
            }
            
            // Check for underlined text _text_
            if (text.charAt(currentIndex) === '_') {
                const endIndex = text.indexOf('_', currentIndex + 1);
                if (endIndex !== -1) {
                    const underlinedText = text.substring(currentIndex + 1, endIndex);
                    elements.push(
                        <Text key={elementKey++} style={styles.underlineText}>
                            {underlinedText}
                        </Text>
                    );
                    currentIndex = endIndex + 1;
                    continue;
                }
            }
            
            // Check for italic text *text* (but not part of **)
            if (text.charAt(currentIndex) === '*' && text.charAt(currentIndex + 1) !== '*') {
                const endIndex = text.indexOf('*', currentIndex + 1);
                if (endIndex !== -1) {
                    const italicText = text.substring(currentIndex + 1, endIndex);
                    elements.push(
                        <Text key={elementKey++} style={styles.italicText}>
                            {italicText}
                        </Text>
                    );
                    currentIndex = endIndex + 1;
                    continue;
                }
            }
            
            // Find the next formatting character
            const nextFormatChar = Math.min(
                text.indexOf('**', currentIndex) === -1 ? text.length : text.indexOf('**', currentIndex),
                text.indexOf('_', currentIndex) === -1 ? text.length : text.indexOf('_', currentIndex),
                text.indexOf('*', currentIndex) === -1 ? text.length : text.indexOf('*', currentIndex),
                text.indexOf('[', currentIndex) === -1 ? text.length : text.indexOf('[', currentIndex)
            );
            
            // Add regular text up to the next formatting character
            if (nextFormatChar > currentIndex) {
                const regularText = text.substring(currentIndex, nextFormatChar);
                if (regularText) {
                    elements.push(regularText);
                }
            }
            
            // Move to the next character or formatting sequence
            currentIndex = nextFormatChar > currentIndex ? nextFormatChar : currentIndex + 1;
        }
        
        return elements.length > 0 ? elements : [text];
    }, []);

    const {
        article,
        loading,
        refreshing,
        articleData,
    } = state;

    // Parse article data from params
    useEffect(() => {
        if (params.articleData) {
            try {
                const parsedArticleData = JSON.parse(params.articleData);
                updateState({ articleData: parsedArticleData });
            } catch (error) {
                console.error('Error parsing article data:', error);
            }
        }
    }, [params.articleData]);

    // Mock article data - replace with actual API call later
    const mockArticle = {
        id: 1,
        title: 'Welcome to SOZO Today',
        category: 'devotional',
        author: 'SOZO Team',
        date: '2024-01-15',
        readTime: '5 min read',
        image: require('../../assets/images/sozo-logo.png'),
        content: `
Welcome to SOZO Today - your daily source of inspiration, devotion, and spiritual growth.

Each day, we bring you carefully curated content designed to strengthen your faith and deepen your relationship with God. Our articles cover a wide range of topics from daily devotionals to worship insights, ministry updates, and personal testimonies.

## Our Mission

At SOZO, we believe in the transformative power of worship and the importance of daily spiritual nourishment. Our mission is to provide you with:

- **Daily Devotionals**: Start each morning with a short devotional that aligns with your Bible reading
- **Worship Insights**: Discover how worship can transform your heart and connect you with God
- **Ministry Updates**: Stay connected with what God is doing in our community
- **Personal Testimonies**: Be encouraged by real stories of faith and transformation

## Getting Started

We encourage you to make SOZO Today part of your daily routine. Whether you're starting your day with a devotional or taking a moment for reflection, we're here to support your spiritual journey.

Stay connected with us through our daily articles, and don't forget to tune in to our live worship sessions and podcasts.

## Community

You're not alone on this journey. Join our community of believers who are growing together in faith. Share your thoughts, ask questions, and encourage one another as we walk this path together.

Thank you for being part of the SOZO family. May God bless you richly as you seek Him each day.
        `,
    };

    useEffect(() => {
        loadArticle();
    }, [articleData]);

    const loadArticle = async () => {
        try {
            updateState({ loading: true });
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            let articleToUse = mockArticle;
            
            // If we have article data from navigation params, use it
            if (articleData) {
                // If the article has a URL, we could fetch the content from there
                // For now, we'll use the devotion text or bible text content from the database if available
                let articleContent = '';
                
                // Handle devotionText (may be rich text object)
                if (articleData.devotionText) {
                    if (typeof articleData.devotionText === 'string') {
                        articleContent = articleData.devotionText;
                    } else if (articleData.devotionText.content) {
                        articleContent = extractTextFromNodes(articleData.devotionText.content);
                    }
                }
                
                // Handle bibleText (may be rich text object)
                if (!articleContent && articleData.bibleText) {
                    if (typeof articleData.bibleText === 'string') {
                        articleContent = articleData.bibleText;
                    } else if (articleData.bibleText.nodes) {
                        articleContent = extractTextFromNodes(articleData.bibleText.nodes);
                    }
                }
                
                // Fallback content if no text found
                if (!articleContent) {
                    articleContent = `
Welcome to this article from SOZO Today.

This article was pulled from our database and is designed to strengthen your faith and deepen your relationship with God.

## Today's Reflection

Take a moment to reflect on God's goodness and faithfulness in your life. Each day brings new opportunities to grow in faith and experience His love.

## Prayer

Lord, thank You for this day and for Your constant presence in our lives. Help us to walk in Your ways and to be a light to others. In Jesus' name, Amen.

## Action Steps

- Spend time in prayer today
- Read a chapter from the Bible
- Share God's love with someone
- Reflect on His blessings in your life

May God bless you as you continue your journey of faith.
                `;
                }

                // If there's a URL, you could fetch the content here
                // if (articleData.url) {
                //     try {
                //         const response = await fetch(articleData.url);
                //         const htmlContent = await response.text();
                //         // Parse and format the HTML content as needed
                //         articleContent = htmlContent;
                //     } catch (error) {
                //         console.error('Error fetching article content:', error);
                //     }
                // }
                
                articleToUse = {
                    id: articleData.id || 1,
                    title: articleData.title || 'SOZO Article',
                    category: 'devotional',
                    author: 'SOZO Team',
                    date: new Date().toISOString(),
                    readTime: '5 min read',
                    image: articleData.image ? (
                        typeof articleData.image === 'string' ? { uri: articleData.image } : articleData.image
                    ) : require('../../assets/images/sozo-logo.png'),
                    content: articleContent,
                    url: articleData.url || ''
                };
            }
            
            updateState({ 
                article: articleToUse, 
                loading: false 
            });
        } catch (error) {
            console.error('Error loading article:', error);
            updateState({ loading: false });
        }
    };

    const handleRefresh = async () => {
        updateState({ refreshing: true });
        await loadArticle();
        updateState({ refreshing: false });
    };

    return (
        <LinearGradient
            start={{ x: 1, y: 0.2 }}
            end={{ x: 1, y: 1 }}
            colors={[
                '#5829af',
                '#5829af',
                '#ffffffff'
            ]}
            locations={[0, 0.08, 0.08]} // hard stop at 8%
            style={{ flex: 1 }}
        >
            <StatusBar translucent={true} backgroundColor={'transparent'} barStyle={'light-content'} />
            
            {/* Back button at top right */}
            <View style={styles.backButtonContainer}>
                <TouchableOpacity 
                    activeOpacity={0.7}
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <MaterialIcons
                        name="arrow-back"
                        size={24}
                        color={Colors.whiteColor}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 100, paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[Colors.primaryColor]}
                        tintColor={Colors.primaryColor}
                    />
                }
            >
                {/* Logo overlay at top left */}
                <View style={{ position: 'absolute', top: 45, left: 5, zIndex: 200 }}>
                    <ExpoImage
                        source={sozoWhiteLogo}
                        style={{ width: 80, height: 80 }}
                        contentFit="contain"
                    />
                </View>
                {/* Worship Anywhere logo at top left */}
                <View style={{ position: 'absolute', top: 15, left: 80, zIndex: 199 }}>
                    <ExpoImage
                        source={worshipLogo}
                        style={{ width: 140, height: 140 }}
                        contentFit="contain"
                    />
                </View>
                {loading ? loadingSection() : articleContent()}
            </ScrollView>
        </LinearGradient>
    );

    function loadingSection() {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primaryColor} />
                <Text style={styles.loadingText}>Loading article...</Text>
            </View>
        );
    }

    function articleContent() {
        if (!article) {
            return (
                <View style={styles.emptyContainer}>
                    <MaterialIcons
                        name="article"
                        size={64}
                        color={Colors.grayColor}
                    />
                    <Text style={styles.emptyTitle}>Article Not Found</Text>
                    <Text style={styles.emptyDescription}>
                        The article you're looking for is not available.
                    </Text>
                </View>
            );
        }

        const formatContent = (content) => {
            // Handle empty content
            if (!content || content.trim() === '') {
                return [
                    <Text key="empty" style={styles.paragraph}>
                        This devotional content is loading...
                    </Text>
                ];
            }
            
            // Split content into paragraphs, handling both \n\n and \n
            const paragraphs = content.split('\n\n').length > 1 ? content.split('\n\n') : content.split('\n');
            
            return paragraphs.map((paragraph, index) => {
                if (paragraph.trim() === '') return null;
                
                // Handle headings with ##
                if (paragraph.startsWith('##')) {
                    return (
                        <Text key={index} style={styles.subheading}>
                            {paragraph.replace('##', '').trim()}
                        </Text>
                    );
                }
                
                // Handle headings with # (single hash)
                if (paragraph.startsWith('#')) {
                    return (
                        <Text key={index} style={styles.subheading}>
                            {paragraph.replace('#', '').trim()}
                        </Text>
                    );
                }
                
                // Handle bullet points and formatted text
                if (paragraph.includes('- **') || paragraph.includes('**') || paragraph.includes('*') || paragraph.includes('_') || paragraph.includes('•') || /^\d+\.\s/.test(paragraph)) {
                    // Split into lines and handle formatted text
                    const lines = paragraph.split('\n');
                    return (
                        <View key={index} style={styles.listContainer}>
                            {lines.map((line, lineIndex) => {
                                if (line.trim() === '') return null;
                                
                                // Handle multiple types of formatting
                                const formattedText = parseFormattedText(line);
                                
                                return (
                                    <Text key={lineIndex} style={styles.paragraph}>
                                        {formattedText}
                                    </Text>
                                );
                            }).filter(Boolean)}
                        </View>
                    );
                }
                
                // Handle regular paragraphs with potential formatted text
                if (paragraph.includes('**') || paragraph.includes('*') || paragraph.includes('_') || paragraph.includes('[')) {
                    const formattedText = parseFormattedText(paragraph);
                    
                    return (
                        <Text key={index} style={styles.paragraph}>
                            {formattedText}
                        </Text>
                    );
                }
                
                return (
                    <Text key={index} style={styles.paragraph}>
                        {paragraph.trim()}
                    </Text>
                );
            }).filter(Boolean);
        };

        return (
            <View style={styles.articleContainer}>
                {/* Article Header */}
                <View style={styles.articleHeader}>
                    <Text style={styles.articleTitle}>{article.title}</Text>
                </View>

                {/* Article Image */}
                {article.image && (
                    <View style={styles.articleImageContainer}>
                        <ExpoImage
                            source={article.image}
                            style={styles.articleImage}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                            priority="high"
                            transition={200}
                        />
                    </View>
                )}

                {/* Article Content */}
                <View style={styles.articleContentContainer}>
                    {formatContent(article.content)}
                </View>
            </View>
        );
    }
});

const styles = StyleSheet.create({
    backButtonContainer: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 200,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Sizes.fixPadding * 4.0,
    },
    loadingText: {
        ...Fonts.whiteColor13Medium,
        marginTop: Sizes.fixPadding,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Sizes.fixPadding * 4.0,
        paddingHorizontal: Sizes.fixPadding * 2.0,
    },
    emptyTitle: {
        ...Fonts.whiteColor18Bold,
        marginTop: Sizes.fixPadding,
        marginBottom: Sizes.fixPadding / 2,
    },
    emptyDescription: {
        ...Fonts.whiteColor13Medium,
        textAlign: 'center',
        lineHeight: 20,
        opacity: 0.8,
    },
    articleContainer: {
        paddingHorizontal: Sizes.fixPadding * 2.0,
    },
    articleHeader: {
        marginBottom: Sizes.fixPadding * -1.5,
    },
    articleTitle: {
        ...Fonts.whiteColor18Bold,
        fontSize: 24,
        lineHeight: 100,
        marginBottom: Sizes.fixPadding,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    articleAuthor: {
        ...Fonts.whiteColor12SemiBold,
        flex: 1,
    },
    articleDate: {
        ...Fonts.whiteColor11Medium,
        flex: 1,
        textAlign: 'center',
        opacity: 0.8,
    },
    articleReadTime: {
        ...Fonts.whiteColor11Medium,
        flex: 1,
        textAlign: 'right',
        opacity: 0.8,
    },
    articleImageContainer: {
        marginBottom: Sizes.fixPadding * 2.0,
        borderRadius: Sizes.fixPadding,
        overflow: 'hidden',
    },
    articleImage: {
        width: '100%',
        height: undefined,
        aspectRatio: 1,
        borderRadius: Sizes.fixPadding,
    },
    articleContentContainer: {
        marginBottom: Sizes.fixPadding * 2.0,
    },
    subheading: {
        ...Fonts.blackColor16Bold,
        marginTop: Sizes.fixPadding * 2.0,
        marginBottom: Sizes.fixPadding,
        fontSize: 18,
    },
    paragraph: {
        ...Fonts.blackColor13Medium,
        lineHeight: 22,
        marginBottom: Sizes.fixPadding * 1.5,
        opacity: 0.9,
    },
    listContainer: {
        marginBottom: Sizes.fixPadding * 1.5,
    },
    boldText: {
        ...Fonts.blackColor13SemiBold,
        fontWeight: 'bold',
    },
    italicText: {
        ...Fonts.blackColor13Medium,
        fontStyle: 'italic',
    },
    underlineText: {
        ...Fonts.blackColor13Medium,
        textDecorationLine: 'underline',
    },
    linkText: {
        ...Fonts.whiteColor13Medium,
        color: '#4CAF50', // Green color for links (keep as is)
        textDecorationLine: 'underline',
    },
});

export default ArticleScreen;
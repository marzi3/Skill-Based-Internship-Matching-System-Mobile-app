import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    Award,
    BookOpen,
    Briefcase,
    Calendar,
    Code,
    Download,
    ExternalLink,
    FileText,
    Home,
    MapPin,
    Phone,
    Share2,
    User
} from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../../src/api/apiClient';

interface StudentProfile {
    _id?: string;
    user?: {
        name: string;
        email: string;
        profilePicture?: string;
        bio?: string;
        location?: string;
    };
    personalInfo?: {
        fullName: string;
        designation?: string;
        email: string;
        phone?: string;
        about?: string;
        country?: string;
        location?: string;
        age?: number;
        gpa?: string;
        portfolioUrl?: string;
    };
    profileImage?: { filePath?: string };
    skills?: Array<{ name: string; proficiency?: string }>;
    education?: Array<{
        institution: string;
        degree: string;
        field: string;
        startDate: string;
        endDate?: string;
        isCurrentlyStudying?: boolean;
    }>;
    schools?: Array<{ school: string }>;
    certifications?: Array<{ name: string; credentialUrl?: string; issuedDate?: string }>;
    uploadedCertificates?: Array<{ title: string; filePath?: string }>;
    projects?: Array<{
        title: string;
        description?: string;
        technologies?: string[];
        repositoryUrl?: string;
        liveUrl?: string;
        screenshots?: Array<{ filePath?: string }>;
    }>;
    resume?: { filePath?: string };
    portfolio?: {
        github?: string;
        linkedin?: string;
        website?: string;
    };
    preferences?: {
        internshipType?: string[];
        industry?: string[];
        workMode?: string[];
    };
}

interface SectionProps {
    title: string;
    children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
    return (
        <View className="mb-6">
            <Text className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">{title}</Text>
            {children}
        </View>
    );
}

function isImageUrl(url?: string | null) {
    if (!url) return false;
    return /^data:image\//i.test(url) || /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
}

function normalizeUrl(url?: string | null) {
    if (!url) return '';
    return url.trim();
}

const getProficiencyColor = (level?: string) => {
    switch (level) {
        case 'BEGINNER':
            return '#3B82F6';
        case 'INTERMEDIATE':
            return '#8B5CF6';
        case 'ADVANCED':
            return '#10B981';
        case 'EXPERT':
            return '#F59E0B';
        default:
            return '#6B7280';
    }
};

export default function CandidateProfile() {
    const { id } = useLocalSearchParams();
    const [student, setStudent] = useState<StudentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        fetchStudentProfile();
    }, [id]);

    const fetchStudentProfile = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get(`auth/students/${id}`);
            if (res.data.success) {
                setStudent(res.data.data.profile);
            }
        } catch (error: any) {
            console.error('Error fetching student profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    if (!student) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={['top']}>
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-gray-400 font-bold text-center">Student profile not found</Text>
                    <TouchableOpacity onPress={() => router.back()} className="mt-4">
                        <Text className="text-indigo-600 font-black">Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const name = student.personalInfo?.fullName || student.user?.name || 'Student';
    const email = student.personalInfo?.email || student.user?.email || '';
    const location = student.personalInfo?.location || student.user?.location || '';
    const about = student.personalInfo?.about || student.user?.bio || '';

    const openCertificate = (url?: string | null) => {
        const normalizedUrl = normalizeUrl(url);
        if (!normalizedUrl) return;

        if (isImageUrl(normalizedUrl)) {
            setSelectedImage(normalizedUrl);
            return;
        }

        Linking.openURL(normalizedUrl).catch(() => {
            setSelectedImage(normalizedUrl);
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-50">
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full">
                    <ArrowLeft size={20} color="#111827" />
                </TouchableOpacity>
                <Text className="text-2xl font-black text-gray-900 tracking-tight flex-1 ml-4">Student Profile</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-6 py-6">
                    {/* Personal Info Card */}
                    <MotiView
                        from={{ opacity: 0, transform: [{ translateY: 10 }] }}
                        animate={{ opacity: 1, transform: [{ translateY: 0 }] }}
                        className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-3xl border border-indigo-100 mb-6"
                    >
                        <View className="flex-row items-start mb-4">
                            {student.profileImage?.filePath && (
                                <Image
                                    source={{ uri: student.profileImage.filePath }}
                                    className="w-16 h-16 bg-white rounded-2xl border border-indigo-100 mr-4"
                                />
                            )}
                            {!student.profileImage?.filePath && (
                                <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center border border-indigo-100 mr-4">
                                    <User size={28} color="#4F46E5" />
                                </View>
                            )}
                            <View className="flex-1">
                                <Text className="text-3xl font-black text-indigo-900 tracking-tight">{name}</Text>
                                {student.personalInfo?.designation && (
                                    <Text className="text-indigo-700 font-bold text-base mt-1">{student.personalInfo.designation}</Text>
                                )}
                                <Text className="text-indigo-600 text-xs font-black uppercase tracking-widest mt-2">{email}</Text>
                            </View>
                        </View>

                        {about && <Text className="text-indigo-800 text-base font-medium leading-6 mb-4">{about}</Text>}

                        <View className="space-y-2">
                            {location && (
                                <View className="flex-row items-center">
                                    <MapPin size={14} color="#6366F1" />
                                    <Text className="text-indigo-700 text-sm font-medium ml-2">{location}</Text>
                                </View>
                            )}
                            {student.personalInfo?.phone && (
                                <View className="flex-row items-center">
                                    <Phone size={14} color="#6366F1" />
                                    <Text className="text-indigo-700 text-sm font-medium ml-2">{student.personalInfo.phone}</Text>
                                </View>
                            )}
                            {student.personalInfo?.gpa && (
                                <View className="flex-row items-center">
                                    <Award size={14} color="#F59E0B" />
                                    <Text className="text-amber-700 text-sm font-medium ml-2">GPA: {student.personalInfo.gpa}</Text>
                                </View>
                            )}
                            {student.personalInfo?.age && (
                                <View className="flex-row items-center">
                                    <Calendar size={14} color="#6366F1" />
                                    <Text className="text-indigo-700 text-sm font-medium ml-2">Age: {student.personalInfo.age}</Text>
                                </View>
                            )}
                        </View>
                    </MotiView>

                    {/* School */}
                    {student.schools && student.schools.length > 0 && (
                        <View className="mb-6">
                            <Text className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">School Information</Text>
                            <View className="space-y-3">
                                {student.schools.map((school, index) => (
                                    <View key={index} className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-3xl p-5">
                                        <View className="flex-row items-center">
                                            <View className="w-10 h-10 rounded-2xl bg-white items-center justify-center border border-blue-100 mr-4">
                                                <Home size={18} color="#2563EB" />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-blue-600 text-[10px] font-black uppercase tracking-widest">School Name</Text>
                                                <Text className="text-gray-900 font-black text-base mt-1.5">{school.school}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Work Mode */}
                    {student.preferences?.workMode && student.preferences.workMode.length > 0 && (
                        <Section title="Work Mode Preference">
                            <View className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
                                {student.preferences.workMode.map((mode, index) => (
                                    <View
                                        key={index}
                                        className={`p-4 ${
                                            index < student.preferences!.workMode!.length - 1
                                                ? 'border-b border-gray-50'
                                                : ''
                                        }`}
                                    >
                                        <View className="flex-row items-center">
                                            <Briefcase size={16} color="#8B5CF6" className="mr-3" />
                                            <Text className="text-gray-900 font-semibold text-base">{mode}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </Section>
                    )}

                    {/* Skills */}
                    {student.skills && student.skills.length > 0 && (
                        <Section title="Skills">
                            <View className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
                                {student.skills.map((skill, index) => (
                                    <View
                                        key={index}
                                        className={`flex-row items-center justify-between p-4 ${
                                            index < student.skills!.length - 1 ? 'border-b border-gray-50' : ''
                                        }`}
                                    >
                                        <Text className="text-gray-900 font-semibold text-base flex-1">{skill.name}</Text>
                                        <View
                                            className="px-3 py-1.5 rounded-full"
                                            style={{ backgroundColor: getProficiencyColor(skill.proficiency) + '20' }}
                                        >
                                            <Text
                                                className="text-sm font-black"
                                                style={{ color: getProficiencyColor(skill.proficiency) }}
                                            >
                                                {skill.proficiency || 'INTERMEDIATE'}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </Section>
                    )}

                    {/* Education */}
                    {student.education && student.education.length > 0 && (
                        <Section title="Education">
                            <View className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
                                {student.education.map((edu, index) => (
                                    <View
                                        key={index}
                                        className={`p-4 ${
                                            index < student.education!.length - 1 ? 'border-b border-gray-50' : ''
                                        }`}
                                    >
                                        <View className="flex-row items-start mb-2">
                                            <BookOpen size={16} color="#4F46E5" className="mt-1 mr-3 flex-shrink-0" />
                                            <View className="flex-1">
                                                <Text className="text-gray-900 font-black text-lg">{edu.institution}</Text>
                                                <Text className="text-gray-600 text-sm font-semibold mt-1">
                                                    {edu.degree} in {edu.field}
                                                </Text>
                                                <Text className="text-gray-400 text-xs font-bold mt-2">
                                                    {new Date(edu.startDate).getFullYear()} -{' '}
                                                    {edu.isCurrentlyStudying
                                                        ? 'Present'
                                                        : edu.endDate
                                                          ? new Date(edu.endDate).getFullYear()
                                                          : 'N/A'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </Section>
                    )}

                    {/* Certifications */}
                    {student.certifications && student.certifications.length > 0 && (
                        <Section title="Certifications">
                            <View className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
                                {student.certifications.map((cert, index) => (
                                    <View
                                        key={index}
                                        className={`p-4 ${
                                            index < student.certifications!.length - 1 ? 'border-b border-gray-50' : ''
                                        }`}
                                    >
                                        <View className="flex-row items-start justify-between">
                                            <View className="flex-row items-start flex-1">
                                                <Award size={16} color="#F59E0B" className="mt-1 mr-3 flex-shrink-0" />
                                                <View className="flex-1">
                                                    <Text className="text-gray-900 font-black text-base">{cert.name}</Text>
                                                    {cert.issuedDate && (
                                                        <Text className="text-gray-400 text-xs font-bold mt-2">
                                                            {new Date(cert.issuedDate).toLocaleDateString('en-US')}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                            {cert.credentialUrl && (
                                                <TouchableOpacity
                                                    onPress={() => openCertificate(cert.credentialUrl)}
                                                    className="ml-2"
                                                >
                                                    <ExternalLink size={16} color="#4F46E5" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </Section>
                    )}

                    {/* Uploaded Certificates with Images */}
                    {student.uploadedCertificates && student.uploadedCertificates.length > 0 && (
                        <Section title="Certificate Files">
                            <View className="space-y-3">
                                {student.uploadedCertificates.map((cert, index) => (
                                    <View key={index} className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
                                        <TouchableOpacity
                                            onPress={() => openCertificate(cert.filePath)}
                                            className="p-4"
                                        >
                                            {cert.filePath?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                <View>
                                                    <Image
                                                        source={{ uri: cert.filePath }}
                                                        className="w-full h-48 rounded-2xl bg-gray-100 mb-3"
                                                    />
                                                    <Text className="text-gray-900 font-black text-base">{cert.title}</Text>
                                                    <View className="flex-row items-center mt-2">
                                                        <Download size={14} color="#4F46E5" />
                                                        <Text className="text-indigo-600 text-sm font-bold ml-2">View Certificate</Text>
                                                    </View>
                                                </View>
                                            ) : (
                                                <View className="flex-row items-center justify-between">
                                                    <View className="flex-row items-center flex-1">
                                                        <FileText size={16} color="#4F46E5" />
                                                        <View className="ml-3 flex-1">
                                                            <Text className="text-gray-900 font-black text-base">{cert.title}</Text>
                                                            <Text className="text-gray-400 text-sm mt-1">Certificate File</Text>
                                                        </View>
                                                    </View>
                                                    <Download size={16} color="#4F46E5" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </Section>
                    )}

                    {/* Projects with Screenshots */}
                    {student.projects && student.projects.length > 0 && (
                        <Section title="Projects">
                            <View className="space-y-4">
                                {student.projects.map((project, index) => (
                                    <View key={index} className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
                                        {project.screenshots && project.screenshots.length > 0 && (
                                            <ScrollView
                                                horizontal
                                                showsHorizontalScrollIndicator={false}
                                                className="mb-4"
                                            >
                                                {project.screenshots.map((screenshot, sIndex) => (
                                                    <TouchableOpacity
                                                        key={sIndex}
                                                        onPress={() => setSelectedImage(screenshot.filePath || null)}
                                                    >
                                                        <Image
                                                            source={{ uri: screenshot.filePath }}
                                                            className="w-48 h-32 ml-4 mt-4 rounded-2xl bg-gray-100"
                                                        />
                                                    </TouchableOpacity>
                                                ))}
                                                {project.screenshots.length > 0 && <View className="w-2" />}
                                            </ScrollView>
                                        )}
                                        <View className="px-4 pb-4">
                                            <Text className="text-gray-900 font-black text-lg">{project.title}</Text>
                                            {project.description && (
                                                <Text className="text-gray-600 text-sm font-medium mt-2 leading-5">
                                                    {project.description}
                                                </Text>
                                            )}
                                            {project.technologies && project.technologies.length > 0 && (
                                                <View className="flex-row flex-wrap gap-2 mt-3">
                                                    {project.technologies.map((tech, tIndex) => (
                                                        <View
                                                            key={tIndex}
                                                            className="bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100"
                                                        >
                                                            <Text className="text-indigo-700 text-sm font-bold">{tech}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                            {(project.repositoryUrl || project.liveUrl) && (
                                                <View className="flex-row gap-3 mt-3">
                                                    {project.repositoryUrl && (
                                                        <TouchableOpacity
                                                            onPress={() => Linking.openURL(project.repositoryUrl!)}
                                                            className="flex-1 flex-row items-center bg-gray-50 p-2 rounded-xl"
                                                        >
                                                            <Code size={14} color="#4F46E5" />
                                                            <Text className="text-indigo-600 text-sm font-bold ml-2">Repo</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                    {project.liveUrl && (
                                                        <TouchableOpacity
                                                            onPress={() => Linking.openURL(project.liveUrl!)}
                                                            className="flex-1 flex-row items-center bg-indigo-50 p-2 rounded-xl border border-indigo-100"
                                                        >
                                                            <ExternalLink size={14} color="#4F46E5" />
                                                            <Text className="text-indigo-600 text-sm font-bold ml-2">Live</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </Section>
                    )}

                    {/* Resume/CV */}
                    {student.resume?.filePath && (
                        <Section title="Resume / CV">
                            <TouchableOpacity
                                onPress={() => Linking.openURL(student.resume!.filePath!)}
                                className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl p-5 flex-row items-center justify-between"
                            >
                                <View className="flex-row items-center flex-1">
                                    <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-indigo-100 mr-4">
                                        <FileText size={24} color="#4F46E5" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-indigo-900 font-black text-base">View Resume</Text>
                                        <Text className="text-indigo-600 text-xs font-bold uppercase tracking-widest mt-1">
                                            CV / Resume Document
                                        </Text>
                                    </View>
                                </View>
                                <ExternalLink size={20} color="#4F46E5" />
                            </TouchableOpacity>
                        </Section>
                    )}

                    {/* Portfolio Links */}
                    {student.portfolio &&
                        (student.portfolio.github || student.portfolio.linkedin || student.portfolio.website) && (
                            <Section title="Portfolio & Links">
                                <View className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
                                    {student.portfolio.github && (
                                        <TouchableOpacity
                                            onPress={() => Linking.openURL(student.portfolio!.github!)}
                                            className="flex-row items-center p-4 border-b border-gray-50"
                                        >
                                            <Code size={20} color="#4F46E5" />
                                            <View className="flex-1 ml-4">
                                                <Text className="text-gray-900 font-black text-base">GitHub</Text>
                                                <Text className="text-gray-500 text-sm mt-1">{student.portfolio.github}</Text>
                                            </View>
                                            <ExternalLink size={16} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    )}
                                    {student.portfolio.linkedin && (
                                        <TouchableOpacity
                                            onPress={() => Linking.openURL(student.portfolio!.linkedin!)}
                                            className="flex-row items-center p-4 border-b border-gray-50"
                                        >
                                            <Share2 size={20} color="#0A66C2" />
                                            <View className="flex-1 ml-4">
                                                <Text className="text-gray-900 font-black text-base">LinkedIn</Text>
                                                <Text className="text-gray-500 text-sm mt-1">{student.portfolio.linkedin}</Text>
                                            </View>
                                            <ExternalLink size={16} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    )}
                                    {student.portfolio.website && (
                                        <TouchableOpacity
                                            onPress={() => Linking.openURL(student.portfolio!.website!)}
                                            className="flex-row items-center p-4"
                                        >
                                            <Globe size={20} color="#10B981" />
                                            <View className="flex-1 ml-4">
                                                <Text className="text-gray-900 font-black text-base">Website</Text>
                                                <Text className="text-gray-500 text-sm mt-1">{student.portfolio.website}</Text>
                                            </View>
                                            <ExternalLink size={16} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </Section>
                        )}

                    {/* Empty State */}
                    {!student.skills &&
                        !student.education &&
                        !student.certifications &&
                        !student.projects && (
                            <View className="items-center justify-center py-12">
                                <User size={48} color="#D1D5DB" />
                                <Text className="text-gray-400 font-bold text-base mt-4">No profile details available yet</Text>
                            </View>
                        )}
                </View>
            </ScrollView>

            {/* Image Modal */}
            <Modal
                visible={!!selectedImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <View className="flex-1 bg-black items-center justify-center">
                    <TouchableOpacity
                        className="absolute top-10 right-6 z-50 p-3 bg-red-500 rounded-full"
                        onPress={() => setSelectedImage(null)}
                        activeOpacity={0.7}
                    >
                        <Text className="text-white font-black text-xl">×</Text>
                    </TouchableOpacity>
                    {selectedImage && (
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => setSelectedImage(null)}
                            className="flex-1 w-full items-center justify-center"
                        >
                            <Image
                                source={{ uri: selectedImage }}
                                className="w-full h-full"
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                    )}
                    <View className="absolute bottom-6 left-0 right-0 items-center">
                        <TouchableOpacity
                            onPress={() => setSelectedImage(null)}
                            className="bg-red-500 px-8 py-3 rounded-full"
                        >
                            <Text className="text-white font-black text-sm">Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// Import Globe icon
const Globe = ({ size, color }: { size: number; color: string }) => (
    <User size={size} color={color} />
);

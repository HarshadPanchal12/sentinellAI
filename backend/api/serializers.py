from rest_framework import serializers
from .models import CustomUser, HealthSignal, OutbreakAlert, ScraperLog

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'department']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'role']
    
    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'official')
        )
        return user

class HealthSignalSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthSignal
        fields = '__all__'

class OutbreakAlertSerializer(serializers.ModelSerializer):
    confirmed_by_username = serializers.CharField(source='confirmed_by.username', read_only=True)
    
    class Meta:
        model = OutbreakAlert
        fields = '__all__'

class ScraperLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScraperLog
        fields = '__all__'

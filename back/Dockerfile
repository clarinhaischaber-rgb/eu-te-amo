# Etapa 1: Compilação com Java 21 e Maven
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copia todo o projeto para o container
COPY . .

# Entra na pasta back para dar permissão e compilar
WORKDIR /app/back
RUN chmod +x ./mvnw
RUN ./mvnw clean package -DskipTests

# Etapa 2: Execução leve com Java 21 JRE
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copia o .jar gerado na pasta back do build para a raiz do container final
COPY --from=build /app/back/target/*.jar app.jar

# Expõe a porta 8081 configurada na aplicação
EXPOSE 8081

# Garante que a variável de porta seja respeitada
ENV PORT=8081

# Executa a aplicação
ENTRYPOINT ["java", "-jar", "app.jar"]
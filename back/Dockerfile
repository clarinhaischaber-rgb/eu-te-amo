# Etapa 1: Compilação com Java 21 e Maven
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copia os arquivos da pasta back para o container
COPY . .

# Dá permissão de execução ao mvnw e compila o projeto sem rodar testes
RUN chmod +x ./mvnw
RUN ./mvnw clean package -DskipTests

# Etapa 2: Execução leve com Java 21 JRE
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copia o .jar compilado para a imagem final
COPY --from=build /app/target/*.jar app.jar

# Expõe a porta 8081 configurada no seu application.properties
EXPOSE 8081

# Garante que o Spring Boot escute na porta 8081 do Render
ENV PORT=8081

# Executa a aplicação
ENTRYPOINT ["java", "-jar", "app.jar"]
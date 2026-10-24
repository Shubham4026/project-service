FROM node:22.23.4-alpine

#Set working directory
WORKDIR /opt/projects

#Copy package.json file
COPY ./package.json /opt/projects/package.json

#Install node packages
RUN npm install
RUN npm install -g nodemon@2.0.20

#Copy all files 
COPY . /opt/projects

#Expose the application port
EXPOSE 5000

#Start the application
# CMD ["npm", "run", "dev"]
CMD ["node", "app.js"]
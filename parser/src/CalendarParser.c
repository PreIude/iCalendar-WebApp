#include <stdio.h>
#include <string.h>
#include <stdbool.h>
#include <ctype.h>

#include "CalendarParser.h"

ICalErrorCode createCalendar(char* fileName, Calendar** obj){

	if (obj==NULL){
		return OTHER_ERROR;
	}

	if (fileName==NULL){
		return INV_FILE;
	}

	(*obj) = malloc (sizeof(Calendar));
	(*obj)->events = initializeList(&printEvent, &deleteEvent, &compareEvents);
	(*obj)->properties = initializeList(&printProperty, &deleteProperty, &compareProperties);

	int i,fileSize,lineCount=0,decimals;
	int eventCount=0;
	bool calendar=false,alarm=false,event=false,proid=false,version=false,action=false,trigger=false, uid=false,start=false,create=false;

	bool allSpace=false;
	bool fold=false;
	bool semi=false;
	bool check=false;
	Alarm* tempAlarm=NULL;
	Event* tempEvent=NULL;
	Property* tempProp=NULL;
	DateTime tempDate;
	char nextChar;
	FILE *fp;
	char* token;
	char * currentLine;
	char * toUnfold;
	char * temp;
	char buffer[2000];

	fp=fopen(fileName,"r");  //open file in read mode
	if (!fp){
		deleteCalendar(*obj);
		*obj=NULL;
		return INV_FILE;
	}else{
		fileSize=strlen(fileName);
		if (fileSize<5){
			deleteCalendar(*obj);
			*obj=NULL;
			fclose(fp);
			return INV_FILE;
		}
		else if (fileName[fileSize-1]!='s' || fileName[fileSize-2]!='c' || fileName[fileSize-3]!='i' || fileName[fileSize-4]!='.'){
			deleteCalendar(*obj);
			*obj=NULL;
			fclose(fp);
			return INV_FILE;
		}
		currentLine = malloc(2000);
		toUnfold = malloc(2000);
		temp = malloc(2000);
		while (fgets(buffer,2000,fp)!= NULL){
			if (buffer[strlen(buffer)-1]!='\n' || buffer[strlen(buffer)-2]!='\r'){
				if (event==true){
					deleteEvent(tempEvent);
				}
				if (alarm==true){
					deleteAlarm(tempAlarm);
				}
				deleteCalendar(*obj);
				*obj=NULL;
				fclose(fp);
				free (currentLine);
				free(toUnfold);
				free(temp);
				return INV_FILE;
			}

			buffer[strcspn(buffer, "\r\n")] = 0;


			if (fold==true){
				strcpy(toUnfold,buffer);
				memmove(toUnfold, toUnfold+1,strlen(toUnfold));
				strcat(currentLine,toUnfold);
				fold=false;
			}else if(semi==true){
				semi=false;
			}
			else{
				strcpy(currentLine,buffer);
				fold=false;
			}
			nextChar = getc(fp);
			if (nextChar==' ' || nextChar=='\t' ){
				fold=true;
			}
			else if (nextChar ==';'){
				semi=true;
			}

			check=true;
			if (fold==false && semi==false){
				ungetc(nextChar, fp);
				check=false;
				if (strchr(currentLine, ':')==NULL && strchr(currentLine, ';')==NULL){
					if (event==true){
						deleteEvent(tempEvent);
					}
					if (alarm==true){
						deleteAlarm(tempAlarm);
					}
					deleteCalendar(*obj);
					*obj=NULL;
					fclose(fp);
					free (currentLine);
					free(toUnfold);
					free(temp);
					return INV_CAL;
				}

				strcpy(temp,currentLine);
				for (i=0;i<strlen(temp);i++){
					temp[i] = (toupper(temp[i]));
				}
				if(strcmp(temp,"BEGIN:VCALENDAR")==0){
					if (calendar==true){
						if (event==true){
							deleteEvent(tempEvent);
						}
						if (alarm==true){
							deleteAlarm(tempAlarm);
						}
						deleteCalendar(*obj);
						*obj=NULL;
						fclose(fp);
						free (currentLine);
						free(toUnfold);
						free(temp);
						return INV_EVENT;
					}
					if (event==true){
						if (event==true){
							deleteEvent(tempEvent);
						}
						if (alarm==true){
							deleteAlarm(tempAlarm);
						}
						deleteCalendar(*obj);
						*obj=NULL;
						fclose(fp);
						free (currentLine);
						free(toUnfold);
						free(temp);
						return INV_EVENT;
					}
					calendar=true;
					continue;
				}

				if (calendar==false){
					if (event==true){
						deleteEvent(tempEvent);
					}
					if (alarm==true){
						deleteAlarm(tempAlarm);
					}
					deleteCalendar(*obj);
					*obj=NULL;
					fclose(fp);
					free (currentLine);
					free(toUnfold);
					free(temp);
					return INV_CAL;
				}

				if(strcmp(temp,"END:VCALENDAR")==0){
					if (proid==false || version == false ||eventCount==0){
						if (event==true){
							deleteEvent(tempEvent);
						}
						if (alarm==true){
							deleteAlarm(tempAlarm);
						}
						deleteCalendar(*obj);
						*obj=NULL;
						fclose(fp);
						free (currentLine);
						free(toUnfold);
						free(temp);
						return INV_CAL;
					}

					if (event==1){
						if (event==true){
							deleteEvent(tempEvent);
						}
						if (alarm==true){
							deleteAlarm(tempAlarm);
						}
						deleteCalendar(*obj);
						*obj=NULL;
						fclose(fp);
						free (currentLine);
						free(toUnfold);
						free(temp);
						return INV_EVENT;

					}
					calendar=false;

					if (fgets(buffer,80,fp)== NULL){
						continue;
					}else{
						if (event==true){
							deleteEvent(tempEvent);
						}
						if (alarm==true){
							deleteAlarm(tempAlarm);
						}
						deleteCalendar(*obj);
						*obj=NULL;
						fclose(fp);
						free (currentLine);
						free(toUnfold);
						free(temp);
						return INV_CAL;
					}
				}
				if(strcmp(temp,"BEGIN:VEVENT")==0){
					if (event==1){
						if (event==true){
							deleteEvent(tempEvent);
						}
						if (alarm==true){
							deleteAlarm(tempAlarm);
						}
						deleteCalendar(*obj);
						*obj=NULL;
						fclose(fp);
						free (currentLine);
						free(toUnfold);
						free(temp);
						return INV_EVENT;
					}
					tempEvent = malloc (sizeof(Event));
					tempEvent->properties = initializeList(&printProperty, &deleteProperty, &compareProperties);
					tempEvent->alarms = initializeList(&printAlarm, &deleteAlarm, &compareAlarms);

					event=true;

					continue;
				}
				if(strcmp(temp,"END:VEVENT")==0 && event==true){
					if (uid==false || start==false || create == false){
						deleteCalendar(*obj);
						*obj=NULL;
						fclose(fp);
						if (event==true){
							deleteEvent(tempEvent);
						}
						if (alarm==true){
							deleteAlarm(tempAlarm);
						}
						free (currentLine);
						free(toUnfold);
						free(temp);
						return INV_EVENT;
					}

					if (alarm==true){
						deleteCalendar(*obj);
						*obj=NULL;
						if (event==true){
							deleteEvent(tempEvent);
						}
						if (alarm==true){
							deleteAlarm(tempAlarm);
						}
						fclose(fp);
						free (currentLine);
						free(toUnfold);
						free(temp);
						return INV_ALARM;
					}
					insertBack((*obj)->events, (void*)tempEvent);


					event=false;
					uid=false;
					start=false;
					create=false;
					eventCount++;
					continue;
				} else if (strcmp(temp,"END:VEVENT")==0 && event==false){

					deleteCalendar(*obj);
					*obj=NULL;
					if (event==true){
						deleteEvent(tempEvent);
					}
					if (alarm==true){
						deleteAlarm(tempAlarm);
					}
					fclose(fp);
					free (currentLine);
					free(toUnfold);
					free(temp);
					return INV_EVENT;


				}
				if(strcmp(temp,"BEGIN:VALARM")==0){
					if (alarm==1){
						deleteCalendar(*obj);
						*obj=NULL;
						fclose(fp);
						if (event==true){
							deleteEvent(tempEvent);
						}
						if (alarm==true){
							deleteAlarm(tempAlarm);
						}
						free (currentLine);
						free(toUnfold);
						free(temp);

						return INV_ALARM;
					}
					tempAlarm = malloc (sizeof(Alarm));
					tempAlarm->trigger=malloc(0);
					tempAlarm->properties = initializeList(&printProperty, &deleteProperty, &compareProperties);
					alarm=true;

					continue;
				}
				if(strcmp(temp,"END:VALARM")==0 && alarm==true && event==true){
					if (trigger==false || action==false){
						deleteCalendar(*obj);
						*obj=NULL;
						if (event==true){
							deleteEvent(tempEvent);
						}
						if (alarm==true){
							deleteAlarm(tempAlarm);
						}
						fclose(fp);
						free (currentLine);
						free(toUnfold);
						free(temp);

						return INV_ALARM;
					}
					insertBack(tempEvent->alarms, (void*)tempAlarm);
					trigger=false;
					action=false;
					alarm=false;
					continue;
				}else if(strcmp(temp,"END:VALARM")==0 && alarm==false){
					deleteCalendar(*obj);
					*obj=NULL;
					if (event==true){
						deleteEvent(tempEvent);
					}
					if (alarm==true){
						deleteAlarm(tempAlarm);
					}
					fclose(fp);
					free (currentLine);
					free(toUnfold);
					free(temp);
					return INV_ALARM;
				}
				token = strtok(currentLine, ";:");
				if (token!=NULL){
					for (i=0;i<strlen(token);i++){
						token[i] = (toupper(token[i]));
					}
					if (strcmp(token,"VERSION")==0 && calendar==true){
						if (version==true){
							deleteCalendar(*obj);
							*obj=NULL;
							if (event==true){
								deleteEvent(tempEvent);
							}
							if (alarm==true){
								deleteAlarm(tempAlarm);
							}
							fclose(fp);
							free (currentLine);
							free(toUnfold);
							free(temp);
							return DUP_VER;
						}
						token = strtok(NULL, "\0");
						if (token==NULL){
							if (event==true){
								deleteEvent(tempEvent);
							}
							if (alarm==true){
								deleteAlarm(tempAlarm);
							}
							deleteCalendar(*obj);
							*obj=NULL;
							fclose(fp);
							free (currentLine);
							free(toUnfold);
							free(temp);
							return INV_VER;
						} else{
							for (i=0;i<strlen(token);i++){
								allSpace=true;
								if((token[i])!=' '){
									allSpace=false;
									break;
								}
							}
							if (allSpace==true){
								if (event==true){
									deleteEvent(tempEvent);
								}
								if (alarm==true){
									deleteAlarm(tempAlarm);
								}
								deleteCalendar(*obj);
								*obj=NULL;
								fclose(fp);
								free (currentLine);
								free(toUnfold);
								free(temp);
								return INV_VER;
							}
							decimals=0;
							for (i=0;i<strlen(token);i++){
								if (token[i]=='.'){
									decimals++;
									if (decimals>1){
										if (event==true){
											deleteEvent(tempEvent);
										}
										if (alarm==true){
											deleteAlarm(tempAlarm);
										}
										deleteCalendar(*obj);
										*obj=NULL;
										fclose(fp);
										free (currentLine);
										free(toUnfold);
										free(temp);
										return INV_VER;
									}
									continue;
								}
								if(isdigit(token[i])==0){
									if (event==true){
										deleteEvent(tempEvent);
									}
									if (alarm==true){
										deleteAlarm(tempAlarm);
									}
									deleteCalendar(*obj);
									*obj=NULL;
									fclose(fp);
									free (currentLine);
									free(toUnfold);
									free(temp);
									return INV_VER;
								}
							}


						}

						(*obj)->version= atof(token);
						version=true;
					} else if(strcmp(token,"PRODID")==0 && calendar==true){
						if (proid==true){
							if (event==true){
								deleteEvent(tempEvent);
							}
							if (alarm==true){
								deleteAlarm(tempAlarm);
							}
							deleteCalendar(*obj);
							*obj=NULL;
							fclose(fp);
							free (currentLine);
							free(toUnfold);
							free(temp);
							return DUP_PRODID;
						}
						token = strtok(NULL, "\0");
						if (token==NULL){
							if (event==true){
								deleteEvent(tempEvent);
							}
							if (alarm==true){
								deleteAlarm(tempAlarm);
							}
							deleteCalendar(*obj);
							*obj=NULL;
							fclose(fp);
							free (currentLine);
							free(toUnfold);
							free(temp);
							return INV_PRODID;
						} else{
							for (i=0;i<strlen(token);i++){
								allSpace=true;
								if((token[i])!=' '){
									allSpace=false;
									break;
								}
							}
							if (allSpace==true){
								if (event==true){
									deleteEvent(tempEvent);
								}
								if (alarm==true){
									deleteAlarm(tempAlarm);
								}
								deleteCalendar(*obj);
								*obj=NULL;
								fclose(fp);
								free (currentLine);
								free(toUnfold);
								free(temp);
								return INV_PRODID;
							}
						}

						strcpy((*obj)->prodID,token);
						proid=true;
					}
					else if (strcmp(token,"UID")==0 && event==true){
						token = strtok(NULL, "\0");
						if (token==NULL){
							deleteCalendar(*obj);
							*obj=NULL;
							fclose(fp);
							if (event==true){
								deleteEvent(tempEvent);
							}
							if (alarm==true){
								deleteAlarm(tempAlarm);
							}
							free (currentLine);
							free(toUnfold);
							free(temp);
							return INV_EVENT;
						} else{
							for (i=0;i<strlen(token);i++){
								allSpace=true;
								if((token[i])!=' '){
									allSpace=false;
									break;
								}
							}
							if (allSpace==true){
								deleteCalendar(*obj);
								*obj=NULL;
								fclose(fp);
								if (event==true){
									deleteEvent(tempEvent);
								}
								if (alarm==true){
									deleteAlarm(tempAlarm);
								}
								free (currentLine);
								free(toUnfold);
								free(temp);
								return INV_EVENT;
							}
						}

						strcpy(tempEvent->UID,token);
						uid=true;
					}
					else if (strcmp(token,"DTSTAMP")==0 && event==true){
						token = strtok(NULL, "\0");
						if (token==NULL){
							deleteCalendar(*obj);
							*obj=NULL;
							fclose(fp);
							if (event==true){
								deleteEvent(tempEvent);
							}
							if (alarm==true){
								deleteAlarm(tempAlarm);
							}
							free (currentLine);
							free(toUnfold);
							free(temp);
							return INV_DT;
						} else{
							for (i=0;i<strlen(token);i++){
								allSpace=true;
								if((token[i])!=' '){
									allSpace=false;
									break;
								}
							}
							if (allSpace==true){
								deleteCalendar(*obj);
								*obj=NULL;
								fclose(fp);
								if (event==true){
									deleteEvent(tempEvent);
								}
								if (alarm==true){
									deleteAlarm(tempAlarm);
								}
								free (currentLine);
								free(toUnfold);
								free(temp);
								return INV_DT;
							}
						}
						token = strtok(token, "T");
						if (strlen(token)!=8){
							deleteCalendar(*obj);
							*obj=NULL;
							fclose(fp);
							if (event==true){
								deleteEvent(tempEvent);
							}
							if (alarm==true){
								deleteAlarm(tempAlarm);
							}
							free (currentLine);
							free(toUnfold);
							free(temp);
							return INV_DT;
						}
						for (i=0;i<strlen(token);i++){
							if(isdigit(token[i])==0){
								deleteCalendar(*obj);
								*obj=NULL;
								fclose(fp);
								if (event==true){
									deleteEvent(tempEvent);
								}
								if (alarm==true){
									deleteAlarm(tempAlarm);
								}
								free (currentLine);
								free(toUnfold);
								free(temp);
								return INV_DT;
							}
						}
						strcpy(tempDate.date,token);
						token = strtok(NULL, "\0");
						if (strlen(token)!=6 && strlen(token)!=7 ){
							deleteCalendar(*obj);
							*obj=NULL;
							if (event==true){
								deleteEvent(tempEvent);
							}
							if (alarm==true){
								deleteAlarm(tempAlarm);
							}
							fclose(fp);
							free (currentLine);
							free(toUnfold);
							free(temp);
							return INV_DT;
						}
						if (strlen(token)!=6 && token[strlen(token)-1]!='Z'){
							deleteCalendar(*obj);
							*obj=NULL;
							if (event==true){
								deleteEvent(tempEvent);
							}
							if (alarm==true){
								deleteAlarm(tempAlarm);
							}
							fclose(fp);
							free (currentLine);
							free(toUnfold);
							free(temp);
							return INV_DT;
						}
						if (strlen(token)==6){
							for (i=0;i<strlen(token);i++){
								if(isdigit(token[i])==0){
									deleteCalendar(*obj);
									*obj=NULL;
									if (event==true){
										deleteEvent(tempEvent);
									}
									if (alarm==true){
										deleteAlarm(tempAlarm);
									}
									fclose(fp);
									free (currentLine);
									free(toUnfold);
									free(temp);
									return INV_DT;
								}
							}
						}else {
							for (i=0;i<strlen(token)-1;i++){
								if(isdigit(token[i])==0){
									deleteCalendar(*obj);
									*obj=NULL;
									if (event==true){
										deleteEvent(tempEvent);
									}
									if (alarm==true){
										deleteAlarm(tempAlarm);
									}
									fclose(fp);
									free (currentLine);
									free(toUnfold);
									free(temp);
									return INV_DT;
								}
							}
						}
						if(token[strlen(token)-1]=='Z'){
							tempDate.UTC=true;
							token[strlen(token)-1]='\0';
						}else{
							tempDate.UTC=false;
						}
						strcpy(tempDate.time,token);
						tempEvent->creationDateTime=tempDate;
						create=true;
					}
					else if (strcmp(token,"DTSTART")==0 && event==true){
						token = strtok(NULL, "\0");
						if (token==NULL){
							deleteCalendar(*obj);
							*obj=NULL;
							if (event==true){
								deleteEvent(tempEvent);
							}
							if (alarm==true){
								deleteAlarm(tempAlarm);
							}
							fclose(fp);
							free (currentLine);
							free(toUnfold);
							free(temp);
							return INV_DT;
						} else{
							for (i=0;i<strlen(token);i++){
								allSpace=true;
								if((token[i])!=' '){
									allSpace=false;
									break;
								}
							}
							if (allSpace==true){
								deleteCalendar(*obj);
								*obj=NULL;
								if (event==true){
									deleteEvent(tempEvent);
								}
								if (alarm==true){
									deleteAlarm(tempAlarm);
								}
								fclose(fp);
								free (currentLine);
								free(toUnfold);
								free(temp);
								return INV_DT;
							}
						}
						token = strtok(token, "T");
						if (strlen(token)!=8){
							deleteCalendar(*obj);
							*obj=NULL;
							if (event==true){
								deleteEvent(tempEvent);
							}
							if (alarm==true){
								deleteAlarm(tempAlarm);
							}							fclose(fp);
							free (currentLine);
							free(toUnfold);
							free(temp);
							return INV_DT;
						}
						for (i=0;i<strlen(token);i++){
							if(isdigit(token[i])==0){
								deleteCalendar(*obj);
								*obj=NULL;
								if (event==true){
									deleteEvent(tempEvent);
								}
								if (alarm==true){
									deleteAlarm(tempAlarm);
								}
								fclose(fp);
								free (currentLine);
								free(toUnfold);
								free(temp);
								return INV_DT;
							}
						}
						strcpy(tempDate.date,token);
						token = strtok(NULL, "\0");
						if (strlen(token)!=6 && strlen(token)!=7 ){
							deleteCalendar(*obj);
							*obj=NULL;
							fclose(fp);
							if (event==true){
								deleteEvent(tempEvent);
							}
							if (alarm==true){
								deleteAlarm(tempAlarm);
							}
							free (currentLine);
							free(toUnfold);
							free(temp);
							return INV_DT;
						}
						if (strlen(token)!=6 && token[strlen(token)-1]!='Z'){
							deleteCalendar(*obj);
							*obj=NULL;
							if (event==true){
								deleteEvent(tempEvent);
							}
							if (alarm==true){
								deleteAlarm(tempAlarm);
							}
							fclose(fp);
							free (currentLine);
							free(toUnfold);
							free(temp);
							return INV_DT;
						}
						if (strlen(token)==6){
							for (i=0;i<strlen(token);i++){
								if(isdigit(token[i])==0){
									deleteCalendar(*obj);
									*obj=NULL;
									if (event==true){
										deleteEvent(tempEvent);
									}
									if (alarm==true){
										deleteAlarm(tempAlarm);
									}
									fclose(fp);
									free (currentLine);
									free(toUnfold);
									free(temp);
									return INV_DT;
								}
							}
						}else {
							for (i=0;i<strlen(token)-1;i++){
								if(isdigit(token[i])==0){
									deleteCalendar(*obj);
									*obj=NULL;
									if (event==true){
										deleteEvent(tempEvent);
									}
									if (alarm==true){
										deleteAlarm(tempAlarm);
									}
									fclose(fp);
									free (currentLine);
									free(toUnfold);
									free(temp);
									return INV_DT;
								}
							}
						}
						if(token[strlen(token)-1]=='Z'){
							tempDate.UTC=true;
							token[strlen(token)-1]='\0';
						}else{
							tempDate.UTC=false;
						}
						strcpy(tempDate.time,token);
						tempEvent->startDateTime=tempDate;
						start=true;

					}else if (buffer[0]=='T' && buffer[1]=='Z' &&buffer[2]=='I' &&buffer[3]=='D' && buffer[4]=='=' && event==true){
						deleteCalendar(*obj);
						*obj=NULL;
						if (event==true){
							deleteEvent(tempEvent);
						}
						if (alarm==true){
							deleteAlarm(tempAlarm);
						}
						fclose(fp);
						free (currentLine);
						free(toUnfold);
						free(temp);
						return INV_DT;
					}
					else if (strcmp(token,"TRIGGER")==0 && event==true && alarm==true){
						token = strtok(NULL, "\0");
						if (token==NULL){
							deleteCalendar(*obj);
							*obj=NULL;
							if (event==true){
								deleteEvent(tempEvent);
							}
							if (alarm==true){
								deleteAlarm(tempAlarm);
							}
							fclose(fp);
							free (currentLine);
							free(toUnfold);
							free(temp);
							return INV_ALARM;
						} else{
							for (i=0;i<strlen(token);i++){
								allSpace=true;
								if((token[i])!=' '){
									allSpace=false;
									break;
								}
							}
							if (allSpace==true){
								deleteCalendar(*obj);
								*obj=NULL;
								fclose(fp);
								if (event==true){
									deleteEvent(tempEvent);
								}
								if (alarm==true){
									deleteAlarm(tempAlarm);
								}
								free (currentLine);
								free(toUnfold);
								free(temp);
								return INV_ALARM;
							}
						}

						tempAlarm->trigger= realloc(tempAlarm->trigger,strlen(token)+1);
						strcpy(tempAlarm->trigger,token);
						trigger=true;
					}
					else if (strcmp(token,"ACTION")==0  && event==true && alarm==true){
						token = strtok(NULL, "\0");
						if (token==NULL){
							if (event==true){
								deleteEvent(tempEvent);
							}
							if (alarm==true){
								deleteAlarm(tempAlarm);
							}
							deleteCalendar(*obj);
							*obj=NULL;
							fclose(fp);
							free (currentLine);
							free(toUnfold);
							free(temp);
							return INV_ALARM;
						} else{
							for (i=0;i<strlen(token);i++){
								allSpace=true;
								if((token[i])!=' '){
									allSpace=false;
									break;
								}
							}
							if (allSpace==true){
								if (event==true){
									deleteEvent(tempEvent);
								}
								if (alarm==true){
									deleteAlarm(tempAlarm);
								}
								deleteCalendar(*obj);
								*obj=NULL;
								fclose(fp);
								free (currentLine);
								free(toUnfold);
								free(temp);
								if (alarm==true){
									return INV_ALARM;
								}else if (event==true){
									return INV_EVENT;
								}else{
									return INV_CAL;
								}

							}
						}

						strcpy(tempAlarm->action,token);
						action=true;
					}else{
						tempProp=malloc(sizeof(Property)+strlen(currentLine)+5000);
						strcpy(tempProp->propName,token);
						token = strtok(NULL, "\0");
						if (token==NULL){
							if (event==true){
								deleteEvent(tempEvent);
							}
							if (alarm==true){
								deleteAlarm(tempAlarm);
							}
							deleteProperty(tempProp);
							deleteCalendar(*obj);
							*obj=NULL;
							fclose(fp);
							free (currentLine);
							free(toUnfold);
							free(temp);
							if (alarm==true){
								return INV_ALARM;
							}else if (event==true){
								return INV_EVENT;
							}else{
								return INV_CAL;
							}
						} else{
							for (i=0;i<strlen(token);i++){
								allSpace=true;
								if((token[i])!=' '){
									allSpace=false;
									break;
								}
							}
							if (allSpace==true){
								if (event==true){
									deleteEvent(tempEvent);
								}
								if (alarm==true){
									deleteAlarm(tempAlarm);
								}
								deleteProperty(tempProp);
								deleteCalendar(*obj);
								*obj=NULL;
								fclose(fp);
								free (currentLine);
								free(toUnfold);
								free(temp);
								if (alarm==true){
									return INV_ALARM;
								}else if (event==true){
									return INV_EVENT;
								}else{
									return INV_CAL;
								}
							}
						}

						strcpy(tempProp->propDescr,token);
						if (alarm==true){
							insertBack(tempAlarm->properties, (void*)tempProp);
						}else if (event==true){
							insertBack(tempEvent->properties, (void*)tempProp);
						}else{
							insertBack((*obj)->properties, (void*)tempProp);
						}
					}
				}
			}
			if (check==true){
				ungetc(nextChar, fp);
				check=false;
			}
			lineCount++;
		}
		if (lineCount==0){
			if (event==true){
				deleteEvent(tempEvent);
			}
			if (alarm==true){
				deleteAlarm(tempAlarm);
			}
			fclose(fp);
			free (currentLine);
			free(toUnfold);
			free(temp);
			deleteCalendar(*obj);
			*obj=NULL;
			return INV_FILE;
		}
		else if (calendar==true){
			if (event==true){
				deleteEvent(tempEvent);
			}
			if (alarm==true){
				deleteAlarm(tempAlarm);
			}
			fclose(fp);
			free (currentLine);
			free(toUnfold);
			free(temp);
			deleteCalendar(*obj);
			*obj=NULL;
			return INV_CAL;
		}
	}

	fclose(fp);
	free (currentLine);
	free(toUnfold);
	free(temp);
	return OK;
}

void deleteCalendar(Calendar* obj){
	Calendar* tmpName;
	if (obj == NULL){
		return;
	}
	tmpName = (Calendar*)obj;
	freeList(tmpName->events);
	freeList(tmpName->properties);
	free(tmpName);
}

char* printCalendar(const Calendar* obj){
	if (obj == NULL){
		return NULL;
	}

	char* finalStr;
	char* propHolder;
	char* eventHolder;

	int len;

	len = strlen(obj->prodID)+50;
	finalStr=malloc(len);
	sprintf(finalStr,"BEGIN:VCALENDAR\r\nVERSION:%lf\r\nPRODID:%s\r\n",obj->version,obj->prodID);
	ListIterator events = createIterator(obj->events);
	void* ev;
	while((ev = nextElement(&events)) != NULL){
		eventHolder=printEvent(ev);
		len=len+strlen(eventHolder)+30;
		finalStr=realloc(finalStr,len);
		strcat(finalStr,"BEGIN:VEVENT\r\n");
		strcat(finalStr,eventHolder);
		free(eventHolder);
		strcat(finalStr,"END:VEVENT\r\n");
	}
	ListIterator prop = createIterator(obj->properties);
	void* pr;
	len=len+53;
	finalStr=realloc(finalStr,len);
	while((pr = nextElement(&prop)) != NULL){
		propHolder=printProperty(pr);
		len=len+strlen(propHolder)+20;
		finalStr=realloc(finalStr,len+20);
		strcat(finalStr,propHolder);
		free(propHolder);

	}
	strcat(finalStr,"END:VCALENDAR\r\n");

	return finalStr;

}

char* printError(ICalErrorCode err){
	char *final=malloc(25);
	switch(err){
		case OK:
		strcpy(final,"OK");
		return final;
		case INV_VER:
		strcpy(final,"INV_VER");
		return final;
		case INV_CAL:
		strcpy(final,"INV_CAL");
		return final;
		case INV_FILE:
		strcpy(final,"INV_FILE");
		return final;
		case INV_EVENT:
		strcpy(final,"INV_EVENT");
		return final;
		case INV_PRODID:
		strcpy(final,"INV_PRODID");
		return final;
		case INV_ALARM:
		strcpy(final,"INV_ALARM");
		return final;
		case INV_DT:
		strcpy(final,"INV_DT");
		return final;
		case DUP_PRODID:
		strcpy(final,"DUP_PRODID");
		return final;
		case WRITE_ERROR:
		strcpy(final,"WRITE_ERROR");
		return final;
		case DUP_VER:
		strcpy(final,"DUP_VER");
		return final;
		default:
		strcpy(final,"OTHER_ERROR");
		return final;
		return("OTHER_ERROR"); break;
	}
}

ICalErrorCode writeCalendar(char* fileName, const Calendar* obj){
	if (obj == NULL || fileName == NULL){
		return WRITE_ERROR;
	}
	int fileSize=strlen(fileName);
	if (fileSize<5){
		return WRITE_ERROR;
	}
	else if (fileName[fileSize-1]!='s' || fileName[fileSize-2]!='c' || fileName[fileSize-3]!='i' || fileName[fileSize-4]!='.'){
		return WRITE_ERROR;
	}
	char* cal = printCalendar(obj);
	FILE *fp = fopen(fileName, "w");
	fprintf(fp, "%s", cal);
	fclose(fp);
	free(cal);
	return OK;
}

ICalErrorCode validateCalendar(const Calendar* obj){

	char *unlimitedList[] =
	{
		"ATTACH", "ATTENDEE", "CATEGORIES", "COMMENT", "CONTACT", "EXDATE", "RELATED-TO", "RESOURCES", "RDATE", "RRULE" , NULL
	};

	char *onceList[] =
	{
		"CLASS", "CREATED", "DESCRIPTION", "GEO", "LAST-MODIFIED", "LOCATION", "ORGANIZER", "PRIORITY", "SEQUENCE", "STATUS", "SUMMARY", "TRANSP", "URL", "RECURRENCE-ID", NULL
	};

	bool calscale=false, method=false,eventProp=false,empty=true;
	char* propNameHolder;
	Property* tmpProp;
	Event* tempEvent;
	Alarm* tempAlarm;
	int i;
	void* ptr;
	if (obj == NULL){
		return INV_CAL;
	}

	//Check if calendar lists are null
	if (obj->events==NULL || obj->properties==NULL){
		return INV_CAL;
	}

	if (obj->prodID[0] == '\0'){
		return INV_CAL;
	}

	for (int i = 0; i < 1000; i++){
		if (obj->prodID[i]=='\0'){
			empty=false;
			break;
		}
	}

	if (empty==true){
		return INV_CAL;
	}

	//Check if calendar has 0 events
	if (getLength(obj->events) <= 0){
		return INV_CAL;
	}

	ListIterator calProps = createIterator(obj->properties);

	while((ptr = nextElement(&calProps)) != NULL){
		empty=true;
		tmpProp=(Property*)ptr;

		if (tmpProp->propName[0] == '\0'){
			return INV_CAL;
		}else if(tmpProp->propDescr[0] == '\0'){
			return INV_CAL;
		}

		for (int i = 0; i < 200; i++){
			if (tmpProp->propName[i] =='\0'){
				empty=false;
				break;
			}
		}

		if (empty==true){
			return INV_CAL;
		}

		propNameHolder = malloc (strlen(tmpProp->propName)+1);
		strcpy(propNameHolder,tmpProp->propName);
		for (i=0;i<strlen(tmpProp->propName);i++){
			propNameHolder[i] = (toupper(propNameHolder[i]));
		}
		if (strcmp(propNameHolder,"VERSION")==0 || strcmp(propNameHolder,"PRODID")==0){
			free(propNameHolder);
			return INV_CAL;
		}else if (strcmp(propNameHolder,"CALSCALE")==0 ){
			if (calscale==true){
				free(propNameHolder);
				return INV_CAL;
			}else{
				calscale=true;
			}
		}
		else if (strcmp(propNameHolder,"METHOD")==0 ){
			if (method==true){
				free(propNameHolder);
				return INV_CAL;
			}else{
				method=true;

			}
		}else{
			free(propNameHolder);
			return INV_CAL;
		}
		free(propNameHolder);
	}

	ListIterator calEvents = createIterator(obj->events);


	while((ptr = nextElement(&calEvents)) != NULL){

		bool class=false,created=false,description=false,geo=false,last=false,location=false,organizer=false,prio=false,seq=false,status=false,summary=false,transp=false,url=false,recurrence=false;
		bool dtend=false,duration=false;
		DateTime tempDT;
		empty=true;
		tempEvent=(Event*)ptr;

		tempDT=tempEvent->creationDateTime;
		if (tempDT.date[0] == '\0'){
			return INV_EVENT;
		}
		for (int i = 0; i < 9; i++){
			if (tempDT.date[i]=='\0'){
				empty=false;
				break;
			}
		}
		if (empty==true){
			return INV_EVENT;
		}


		if (strlen(tempDT.date)!=8){
			return INV_EVENT;
		}


		empty=true;
		if (tempDT.time[0] == '\0'){
			return INV_EVENT;
		}
		for (int i = 0; i < 7; i++){
			if (tempDT.time[i]=='\0'){
				empty=false;
				break;
			}
		}
		if (empty==true){
			return INV_EVENT;
		}

		if (strlen(tempDT.time)!=6){
			return INV_EVENT;
		}



		empty=true;
		tempDT=tempEvent->startDateTime;

		if (tempDT.date[0] == '\0'){
			return INV_EVENT;
		}
		for (int i = 0; i < 9; i++){
			if (tempDT.date[i]=='\0'){
				empty=false;
				break;
			}
		}
		if (empty==true){
			return INV_EVENT;
		}
		if (strlen(tempDT.date)!=8){
			return INV_EVENT;
		}

		empty=true;
		if (tempDT.time[0] == '\0'){
			return INV_EVENT;
		}
		for (int i = 0; i < 7; i++){
			if (tempDT.time[i]=='\0'){
				empty=false;
				break;
			}
		}
		if (empty==true){
			return INV_EVENT;
		}

		if (strlen(tempDT.time)!=6){
			return INV_EVENT;
		}

		empty=true;

		if (tempEvent->properties==NULL || tempEvent->alarms==NULL){
			return INV_EVENT;
		}

		if (tempEvent->UID[0] == '\0'){
			return INV_EVENT;
		}

		for (int i = 0; i < 1000; i++){
			if (tempEvent->UID[i]=='\0'){
				empty=false;
				break;
			}
		}

		if (empty==true){
			return INV_EVENT;
		}


		ListIterator eventProps = createIterator(tempEvent->properties);
		while((ptr = nextElement(&eventProps)) != NULL){
			bool unlimited = false;
			empty=true;
			eventProp=false;
			tmpProp=(Property*)ptr;
			if (tmpProp->propDescr[0] == '\0'){
				return INV_EVENT;
			}

			if (tmpProp->propName[0] == '\0'){
				return INV_EVENT;
			}

			for (int i = 0; i < 200; i++){
				if (tmpProp->propName[i]=='\0'){
					empty=false;
					break;
				}
			}

			if (empty==true){
				return INV_EVENT;
			}
			propNameHolder = malloc (strlen(tmpProp->propName)+1);
			strcpy(propNameHolder,tmpProp->propName);
			for (i=0;i<strlen(tmpProp->propName);i++){
				propNameHolder[i] = (toupper(propNameHolder[i]));
			}
			if (strcmp(propNameHolder,"UID")==0 || strcmp(propNameHolder,"DTSTART")==0 || strcmp(propNameHolder,"DTSTAMP")==0 ){
				free(propNameHolder);
				return INV_EVENT;

			}else if (strcmp(propNameHolder,"DTEND")==0){
				eventProp = true;
				dtend=true;
				free(propNameHolder);
				continue;
			}else if (strcmp(propNameHolder,"DURATION")==0){
				eventProp = true;
				duration=true;
				free(propNameHolder);
				continue;
			}
			for ( i = 0; unlimitedList[i] != NULL; i++)
			{
				if (strcmp(unlimitedList[i],propNameHolder)==0)
				{
					eventProp = true;
					unlimited = true;
					break;
				}else{
					eventProp = false;
				}
			}
			if (eventProp==false){
				for ( i = 0; onceList[i] != NULL; i++)
				{
					if (strcmp(onceList[i],propNameHolder)==0)
					{
						eventProp = true;
						break;
					}else{
						eventProp = false;
					}
				}
			}
			if (eventProp==false){
				free(propNameHolder);
				return INV_EVENT;
			}else{

				if(eventProp==true && unlimited==true){

				}
				else if (strcmp(onceList[i],"CLASS")==0){
					if (class==true){
						free(propNameHolder);
						return INV_EVENT;
					}else{
						class=true;
					}
				}else if (strcmp(onceList[i],"CREATED")==0){
					if (created==true){
						free(propNameHolder);
						return INV_EVENT;
					}else{
						created=true;
					}
				}else if (strcmp(onceList[i],"DESCRIPTION")==0){
					if (description==true){
						free(propNameHolder);
						return INV_EVENT;
					}else{
						description=true;
					}
				}else if (strcmp(onceList[i],"GEO")==0){
					if (geo==true){
						free(propNameHolder);
						return INV_EVENT;
					}else{
						geo=true;
					}
				}else if (strcmp(onceList[i],"LAST-MODIFIED")==0){
					if (last==true){
						free(propNameHolder);
						return INV_EVENT;
					}else{
						last=true;
					}
				}else if (strcmp(onceList[i],"LOCATION")==0){
					if (location==true){
						free(propNameHolder);
						return INV_EVENT;
					}else{
						location=true;
					}
				}else if (strcmp(onceList[i],"ORGANIZER")==0){
					if (organizer==true){
						free(propNameHolder);
						return INV_EVENT;
					}else{
						organizer=true;
					}
				}else if (strcmp(onceList[i],"PRIORITY")==0){
					if (prio==true){
						free(propNameHolder);
						return INV_EVENT;
					}else{
						prio=true;
					}
				}else if (strcmp(onceList[i],"SEQUENCE")==0){
					if (seq==true){
						free(propNameHolder);
						return INV_EVENT;
					}else{
						seq=true;
					}
				}else if (strcmp(onceList[i],"STATUS")==0){
					if (status==true){
						free(propNameHolder);
						return INV_EVENT;
					}else{
						status=true;
					}
				}else if (strcmp(onceList[i],"SUMMARY")==0){
					if (summary==true){
						free(propNameHolder);
						return INV_EVENT;
					}else{
						summary=true;
					}
				}else if (strcmp(onceList[i],"TRANSP")==0){
					if (transp==true){
						free(propNameHolder);
						return INV_EVENT;
					}else{
						transp=true;
					}
				}else if (strcmp(onceList[i],"URL")==0){
					if (url==true){
						free(propNameHolder);
						return INV_EVENT;
					}else{
						url=true;
					}
				}else if (strcmp(onceList[i],"RECURRENCE-ID")==0){
					if (recurrence==true){
						free(propNameHolder);
						return INV_EVENT;
					}else{
						recurrence=true;
					}
				}
			}
			free(propNameHolder);
		}
		if (duration==true && dtend==true){
			return INV_EVENT;
		}


	}


	calEvents = createIterator(obj->events);


	while((ptr = nextElement(&calEvents)) != NULL){

		tempEvent=(Event*)ptr;

		ListIterator eventAlarms = createIterator(tempEvent->alarms);

		while((ptr = nextElement(&eventAlarms)) != NULL){
			tempAlarm = (Alarm*)ptr;
			bool alarmRepeat=false,alarmDuration=false,alarmAttach=false;
			empty=true;

			if (tempAlarm->action[0] == '\0'){
				return INV_ALARM;
			}else if(tempAlarm->trigger == NULL){
				return INV_ALARM;
			}else if (tempAlarm->trigger[0] == '\0'){
				return INV_ALARM;
			}else if (tempAlarm->properties==NULL){
				return INV_ALARM;
			}

			for (int i = 0; i < 200; i++){
				if (tempAlarm->action[i] =='\0'){
					empty=false;
					break;
				}
			}

			if (empty==true){
				return INV_ALARM;
			}


			propNameHolder = malloc (strlen(tempAlarm->action)+1);
			strcpy(propNameHolder,tempAlarm->action);
			for (i=0;i<strlen(tempAlarm->action);i++){
				propNameHolder[i] = (toupper(propNameHolder[i]));
			}

			if (strcmp(propNameHolder,"AUDIO")!=0){
				free(propNameHolder);
				return INV_ALARM;
			}
			free(propNameHolder);

			ListIterator alarmProps = createIterator(tempAlarm->properties);

			while((ptr = nextElement(&alarmProps)) != NULL){
				empty=true;

				tmpProp=(Property*)ptr;
				if (tmpProp->propDescr[0] == '\0'){
					return INV_ALARM;
				}

				if (tmpProp->propName[0] == '\0'){
					return INV_ALARM;
				}

				for (int i = 0; i < 200; i++){
					if (tmpProp->propName[i]=='\0'){
						empty=false;
						break;
					}
				}
				if (empty==true){
					return INV_ALARM;
				}
				propNameHolder = malloc (strlen(tmpProp->propName)+1);
				strcpy(propNameHolder,tmpProp->propName);
				for (i=0;i<strlen(tmpProp->propName);i++){
					propNameHolder[i] = (toupper(propNameHolder[i]));
				}
				if (strcmp(propNameHolder,"TRIGGER")==0 || strcmp(propNameHolder,"ACTION")==0){
					free(propNameHolder);
					return INV_ALARM;
				}else if(strcmp(propNameHolder,"DURATION")==0){
					if (alarmDuration){
						free(propNameHolder);
						return INV_ALARM;
					}else{
						alarmDuration=true;
					}
				}else if(strcmp(propNameHolder,"REPEAT")==0){
					if (alarmRepeat==true){
						free(propNameHolder);
						return INV_ALARM;
					}else{
						alarmRepeat=true;
					}
				}else if(strcmp(propNameHolder,"ATTACH")==0){
					if (alarmAttach== true){
						free(propNameHolder);
						return INV_ALARM;
					}else{
						alarmAttach=true;
					}
				}else{
					free(propNameHolder);
					return INV_ALARM;
				}
				free(propNameHolder);
			}
			if(alarmDuration==true || alarmRepeat==true ){
				if (alarmDuration!=true || alarmRepeat!=true ){
					return INV_ALARM;
				}
			}
		}
	}

	return OK;

}
void deleteEvent(void* toBeDeleted){
	Event* tmpName;
	if (toBeDeleted == NULL){
		return;
	}
	tmpName = (Event*)toBeDeleted;
	freeList(tmpName->properties);
	freeList(tmpName->alarms);
	free(tmpName);
}


int compareEvents(const void* first, const void* second){
	Event* tmpName1;
	Event* tmpName2;
	if (first == NULL || second == NULL){
		return 0;
	}
	tmpName1 = (Event*)first;
	tmpName2 = (Event*)second;
	return strcmp((char*)tmpName1->UID, (char*)tmpName2->UID);
}

char* printEvent(void* toBePrinted){

	if (toBePrinted == NULL){
		return NULL;
	}

	int len;
	char * propHolder;
	char * alarmHolder;
	char * tmpStr;

	Event* temp = (Event*)toBePrinted;
	ListIterator iter = createIterator(temp->properties);
	void* elem;
	char* finalStr;

	len = strlen(temp->UID)+11;
	finalStr = malloc(len);

	sprintf(finalStr,"UID:%s\r\n",temp->UID);

	DateTime x = temp->creationDateTime;
	len=len+60;
	finalStr=realloc(finalStr,len);
	tmpStr=malloc(len);

	if (x.UTC==1){
		sprintf(tmpStr, "DTSTAMP:%sT%sZ\r\n", x.date, x.time);
	}else{
		sprintf(tmpStr, "DTSTAMP:%sT%s\r\n", x.date, x.time);
	}


	strcat(finalStr,tmpStr);
	x = temp->startDateTime;
	len=len+60;
	finalStr=realloc(finalStr,len);
	tmpStr=realloc(tmpStr,len);

	if (x.UTC==1){
		sprintf(tmpStr, "DTSTART:%sT%sZ\r\n", x.date, x.time);
	}else{
		sprintf(tmpStr, "DTSTART:%sT%s\r\n", x.date, x.time);
	}

	strcat(finalStr,tmpStr);
	while((elem = nextElement(&iter)) != NULL){
		Property* tmpName = (Property*)elem;
		propHolder = printProperty(tmpName);
		len=len+strlen(propHolder)+1;
		finalStr=realloc(finalStr,len);
		strcat(finalStr,propHolder);
		free(propHolder);
	}
	ListIterator alarm = createIterator(temp->alarms);
	void* al;
	while((al = nextElement(&alarm)) != NULL){
		Alarm* ala = (Alarm*)al;
		alarmHolder = printAlarm(ala);
		len=len+strlen(alarmHolder)+3;
		finalStr=realloc(finalStr,len);
		strcat(finalStr,alarmHolder);
		free(alarmHolder);
	}
	free(tmpStr);
	return finalStr;
}


void deleteAlarm(void* toBeDeleted){
	if (toBeDeleted == NULL){
		return;
	}
	Alarm* tmpName;

	tmpName = (Alarm*)toBeDeleted;
	free(tmpName->trigger);
	freeList(tmpName->properties);
	free(tmpName);
}


int compareAlarms(const void* first, const void* second){
	Alarm* tmpName1;
	Alarm* tmpName2;
	if (first == NULL || second == NULL){
		return 0;
	}
	tmpName1 = (Alarm*)first;
	tmpName2 = (Alarm*)second;
	return strcmp((char*)tmpName1->action, (char*)tmpName2->action);
}

char* printAlarm(void* toBePrinted){

	if (toBePrinted == NULL){
		return NULL;
	}

	char* tmpStr;
	char* finalStr;
	char* propHolder;

	Alarm* temp = (Alarm*)toBePrinted;
	ListIterator iter = createIterator(temp->properties);
	void* elem;

	int len;


	len = strlen(temp->trigger)+200+30;
	finalStr = malloc(15);
	sprintf(finalStr,"BEGIN:VALARM\r\n");
	tmpStr = (char*)malloc(sizeof(char)*len);
	while((elem = nextElement(&iter)) != NULL){
		Property* tmpName = (Property*)elem;
		propHolder = printProperty(tmpName);
		len = len + strlen(propHolder);
		tmpStr=realloc(tmpStr,len+12);
		sprintf(tmpStr,"%s", propHolder);
		free(propHolder);
		finalStr=realloc(finalStr,len);
		strcat(finalStr,tmpStr);
	}



	sprintf(tmpStr,"TRIGGER:%s\r\n", temp->trigger);
	strcat(finalStr,tmpStr);
	sprintf(tmpStr,"ACTION:%s\r\n", temp->action);
	strcat(finalStr,tmpStr);
	free(tmpStr);
	strcat(finalStr,"END:VALARM\r\n");
	return finalStr;
}


void deleteProperty(void* toBeDeleted){
	Property* tmpName;
	if (toBeDeleted == NULL){
		return;
	}
	tmpName = (Property*)toBeDeleted;
	free(tmpName);
}


int compareProperties(const void* first, const void* second){
	Property* tmpName1;
	Property* tmpName2;
	if (first == NULL || second == NULL){
		return 0;
	}
	tmpName1 = (Property*)first;
	tmpName2 = (Property*)second;
	return strcmp((char*)tmpName1->propName, (char*)tmpName2->propName);
}


char* printProperty(void* toBePrinted){
	if (toBePrinted == NULL){
		return NULL;
	}
	char* tmpStr;
	Property* tmpName;
	int len;
	int i;
	bool colonFound=false;
	tmpName = (Property*)toBePrinted;
	len = strlen(tmpName->propName)+strlen(tmpName->propDescr)+28;
	tmpStr = (char*)malloc(sizeof(char)*len);
	for (i=0;i<strlen(tmpName->propDescr);i++){
		if (tmpName->propDescr[i]==';' || tmpName->propDescr[i]==':'){
			colonFound=true;
		}
	}
	if (colonFound){
		sprintf(tmpStr, "%s;%s\r\n", tmpName->propName, tmpName->propDescr);
	}else{
		sprintf(tmpStr, "%s:%s\r\n", tmpName->propName, tmpName->propDescr);
	}
	return tmpStr;
}


void deleteDate(void* toBeDeleted){

}

int compareDates(const void* first, const void* second){
	return 0;
}


char* printDate(void* toBePrinted){

	if (toBePrinted == NULL){
		return NULL;
	}

	char* tmpStr;
	DateTime* tmpName;
	int len;

	tmpName = (DateTime*)toBePrinted;
	len = strlen(tmpName->date)+strlen(tmpName->time)+28;
	tmpStr = (char*)malloc(sizeof(char)*len);

	if (tmpName->UTC){
		sprintf(tmpStr, "%s%sZ\r\n", tmpName->date, tmpName->time);

	}else{
		sprintf(tmpStr, "%s%s\r\n", tmpName->date, tmpName->time);

	}

	return tmpStr;
}

char* dtToJSON(DateTime dt){
	char* finalStr;
	finalStr= malloc (61);
	if (dt.UTC){
		sprintf(finalStr, "{\"date\":\"%s\",\"time\":\"%s\",\"isUTC\":true}", dt.date, dt.time);
	} else{
		sprintf(finalStr, "{\"date\":\"%s\",\"time\":\"%s\",\"isUTC\":false}", dt.date, dt.time);
	}
	return finalStr;
}


char* propertyToJSON(const Property* prop){
	char* finalStr;
	if (prop==NULL){
		finalStr=malloc(3);
		strcpy(finalStr,"{}");
		return finalStr;
	}
	finalStr=malloc(strlen(prop->propName)+strlen(prop->propDescr)+100);
	sprintf(finalStr,"{\"propName\":\"%s\",\"description\":\"%s\"}",prop->propName,prop->propDescr);
	return finalStr;
}


char* propListToJSON(const List* propList){
	char* finalStr = malloc(3);
	int count=0;
	if (propList==NULL){
		strcpy(finalStr,"[]");
		return finalStr;
	}
	int len = 3;
	strcpy(finalStr,"[");
	char* propHolder;
	Node* ptr = propList->head;
	while(ptr != NULL){
		Property* currProp = (Property*)ptr->data;
		propHolder=propertyToJSON(currProp);
		len=strlen(propHolder)+len+12;
		finalStr=realloc(finalStr,len);
		if (count>0){
			strcat(finalStr,",");
		}
		strcat(finalStr,propHolder);
		free(propHolder);
		ptr = ptr->next;
		count++;
	}
	strcat(finalStr,"]");
	if (count==0){
		strcpy(finalStr,"[]");
	}
	return finalStr;
}

char* alarmToJSON(const Alarm* alarm){
	char* finalStr;
	if (alarm==NULL){
		finalStr=malloc(3);
		strcpy(finalStr,"{}");
		return finalStr;
	}
	int propCount=2;
	Node* ptr = alarm->properties->head;
	while(ptr != NULL){
		propCount++;
		ptr = ptr->next;
	}
	finalStr=malloc(strlen(alarm->action)+strlen(alarm->trigger)+100);
	sprintf(finalStr,"{\"action\":\"%s\",\"trigger\":\"%s\",\"numProps\":%d}",alarm->action,alarm->trigger,propCount);
	return finalStr;
}

char* alarmListToJSON(const List* alarmList){
	char* finalStr = malloc(3);
	int count=0;
	if (alarmList==NULL){
		strcpy(finalStr,"[]");
		return finalStr;
	}
	int len = 3;

	strcpy(finalStr,"[");
	char* alarmHolder;
	Node* ptr = alarmList->head;
	while(ptr != NULL){
		Alarm* currProp = (Alarm*)ptr->data;
		alarmHolder=alarmToJSON(currProp);
		len=strlen(alarmHolder)+len+12;
		finalStr=realloc(finalStr,len);
		if (count>0){
			strcat(finalStr,",");
		}
		strcat(finalStr,alarmHolder);
		free(alarmHolder);
		ptr = ptr->next;
		count++;
	}
	strcat(finalStr,"]");

	if (count==0){
		strcpy(finalStr,"[]");
	}
	return finalStr;
}

char* eventToJSON(const Event* event){
	char* finalStr;
	if (event==NULL){
		finalStr=malloc(3);
		strcpy(finalStr,"{}");
		return finalStr;
	}
	char* dateHolder;
	char* summaryHolder;
	char* organizerHolder;
	char* locationHolder;


	int propCount=3;
	int alarmCount=0;
	bool summary=false;
	bool location=false;
	bool organizer=false;

	Node* ptr = event->properties->head;
	while(ptr != NULL){
		Property* currProp = (Property*)ptr->data;
		if (strcmp(currProp->propName,"SUMMARY")==0){
			summaryHolder=malloc(strlen(currProp->propDescr)+1);
			strcpy(summaryHolder,currProp->propDescr);
			summary=true;
		}

		if (strcmp(currProp->propName,"LOCATION")==0){
			locationHolder=malloc(strlen(currProp->propDescr)+1);
			strcpy(locationHolder,currProp->propDescr);
			location=true;
		}

		if (strcmp(currProp->propName,"ORGANIZER")==0){
			organizerHolder=malloc(strlen(currProp->propDescr)+1);
			strcpy(organizerHolder,currProp->propDescr);
			organizer=true;
		}

		propCount++;
		ptr = ptr->next;
	}
	ptr = event->alarms->head;
	while(ptr != NULL){
		alarmCount++;
		ptr = ptr->next;
	}
	dateHolder=dtToJSON(event->startDateTime);
	if (summary){
		finalStr=malloc(strlen(dateHolder)+strlen(summaryHolder)+100);
		sprintf(finalStr,"{\"startDT\":%s,\"numProps\":%d,\"numAlarms\":%d,\"summary\":\"%s\",\"organizer\":\"",dateHolder,propCount,alarmCount,summaryHolder);
		free(summaryHolder);
	}else{
		finalStr=malloc(strlen(dateHolder)+100);
		sprintf(finalStr,"{\"startDT\":%s,\"numProps\":%d,\"numAlarms\":%d,\"summary\":\"\",\"organizer\":\"",dateHolder,propCount,alarmCount);
	}

	if (organizer){
		finalStr = realloc(finalStr,strlen(finalStr)+strlen(organizerHolder)+100);
		strcat(finalStr,organizerHolder);
		strcat(finalStr,"\",\"location\":\"");
		free(organizerHolder);
	}else{
		strcat(finalStr,"\",\"location\":\"");

	}

	if (location){
		finalStr = realloc(finalStr,strlen(finalStr)+strlen(locationHolder)+100);

		strcat(finalStr,locationHolder);
		strcat(finalStr,"\"");
		free(locationHolder);

	}else{
		strcat(finalStr,"\"");
	}
	strcat(finalStr,"}");
	free(dateHolder);
	return finalStr;
}

char* calendarToEventListJSON(const Calendar* cal){
	return eventListToJSON(cal->events);
}

char* eventListToJSON(const List* eventList){
	char* finalStr = malloc(3);
	int count=0;
	if (eventList==NULL){
		strcpy(finalStr,"[]");
		return finalStr;
	}
	int len = 3;

	strcpy(finalStr,"[");
	char* eventHolder;
	Node* ptr = eventList->head;
	while(ptr != NULL){
		Event* currProp = (Event*)ptr->data;
		eventHolder=eventToJSON(currProp);
		len=strlen(eventHolder)+len+12;
		finalStr=realloc(finalStr,len);
		if (count>0){
			strcat(finalStr,",");
		}
		strcat(finalStr,eventHolder);
		free(eventHolder);
		ptr = ptr->next;
		count++;
	}
	strcat(finalStr,"]");

	if (count==0){
		strcpy(finalStr,"[]");
	}
	return finalStr;
}

char* calendarToJSON(const Calendar* cal){
	char* finalStr;
	if (cal==NULL){
		finalStr=malloc(3);
		strcpy(finalStr,"{}");
		return finalStr;
	}
	int propCount=0;
	int eventCount=0;
	Node* ptr = cal->properties->head;
	while(ptr != NULL){
		propCount++;
		ptr = ptr->next;
	}
	ptr = cal->events->head;
	while(ptr != NULL){
		eventCount++;
		ptr = ptr->next;
	}
	finalStr= malloc(strlen(cal->prodID)+200);
	sprintf(finalStr, "{\"version\":%d,\"prodID\":\"%s\",\"numProps\":%d,\"numEvents\":%d}", (int)cal->version, cal->prodID,propCount+2,eventCount);

	return finalStr;
}

Calendar* JSONtoCalendar(const char* str){
	float version = 0.00;
	Calendar* final;
	if (str==NULL){
		return NULL;
	}
	if (str[0]!='{' && str[1]!='\"' && str[strlen(str)-1]!='}' && str[strlen(str)-2]!='\"'){
		return NULL;
	}
	final = malloc (sizeof(Calendar));
	final->version=0.00;

	final->events = initializeList(&printEvent, &deleteEvent, &compareEvents);
	final->properties = initializeList(&printProperty, &deleteProperty, &compareProperties);
	char* temp= malloc (strlen(str)+1);
	strcpy(temp,str);
	char*token = strtok(temp,"\"");
	token = strtok(NULL,":");
	if (strcmp("version\"",token)!=0){
		deleteCalendar(final);
		return NULL;
	}
	token = strtok(NULL,"\"");
	if (token[strlen(token)-1]!=','){
		deleteCalendar(final);
		return NULL;
	}
	token[strlen(token)-1]='\0';
	version = atof(token);
	final->version=version;

	token = strtok(NULL,"\"");
	if (strcmp("prodID",token)!=0){
		deleteCalendar(final);
		return NULL;
	}
	token = strtok(NULL,"\"");
	if (token[0]!=':'){
		deleteCalendar(final);
		return NULL;
	}
	token = strtok(NULL,"\0");
	token[strlen(token)-2]='\0';
	strcpy(final->prodID,token);

	free(temp);
	return final;
}

Event* JSONtoEvent(const char* str){
	Event* final;
	if (str==NULL){
		return NULL;
	}
	if (str[0]!='{' && str[1]!='\"' && str[strlen(str)-1]!='}' && str[strlen(str)-2]!='\"'){
		return NULL;
	}
	final = malloc (sizeof(Event));;
	final->properties = initializeList(&printProperty, &deleteProperty, &compareProperties);
	final->alarms = initializeList(&printAlarm, &deleteAlarm, &compareAlarms);
	char* temp= malloc (strlen(str)+1);
	strcpy(temp,str);
	char*token = strtok(temp,"\"");
	token = strtok(NULL,":");
	if (strcmp("UID\"",token)!=0){
		deleteEvent(final);
		return NULL;
	}
	token = strtok(NULL,"\0");
	token[strlen(token)-2]='\0';
	memmove(token, token+1,strlen(token));
	strcpy(final->UID,token);
	free(temp);
	return final;
}

void addEvent(Calendar* cal, Event* toBeAdded){
	if (cal==NULL || toBeAdded==NULL || cal->events==NULL){
		return;
	}
	insertBack(cal->events, (void*)toBeAdded);
}

char* eventToPropList(const Calendar* cal, int index){
	int count = 0;
	Node* ptr = cal->events->head;
	Event* currEvent;
	while(ptr != NULL){
		currEvent = (Event*)ptr->data;
		if (count==index-1){
			break;
		}
		ptr = ptr->next;
		count++;
	}
	return propListToJSON(currEvent->properties);
}

char* getAddedEvent(char* fileName, Calendar* cal, char* startDate,char* startTime, char* creationDate, char* creationTime, char* uid, char* summary, int utc){
	char* final;
	Event* tempEvent = malloc(sizeof(Event));
	tempEvent->properties = initializeList(&printProperty, &deleteProperty, &compareProperties);
	tempEvent->alarms = initializeList(&printAlarm, &deleteAlarm, &compareAlarms);
	DateTime start,creation;
	strcpy(start.date,startDate);
	strcpy(start.time,startTime);
	start.UTC=utc;
	tempEvent->startDateTime=start;
	strcpy(creation.date,creationDate);
	strcpy(creation.time,creationTime);
	creation.UTC=utc;
	tempEvent->creationDateTime=creation;
	strcpy(tempEvent->UID,uid);
	if (summary[0]!='\0'){
		Property*tempProp=malloc(sizeof(Property)+strlen(summary));
		strcpy(tempProp->propName,"SUMMARY");
		strcpy(tempProp->propDescr,summary);
		insertBack(tempEvent->properties, (void*)tempProp);
		final = eventToJSON(tempEvent);
		addEvent(cal,tempEvent);
		writeCalendar(fileName,cal);
	}else{
		final = eventToJSON(tempEvent);
		addEvent(cal,tempEvent);
		writeCalendar(fileName,cal);
	}
	return final;
}

char* getAddedCal(char* fileName, char* startDate,char* startTime, char* creationDate, char* creationTime, char* uid, char* summary,char*version,char*prodID, int utc){
	Calendar* tempCal = malloc(sizeof(Calendar));

	tempCal->events = initializeList(&printEvent, &deleteEvent, &compareEvents);
	tempCal->properties = initializeList(&printProperty, &deleteProperty, &compareProperties);

	tempCal->version=atof(version);
	strcpy(tempCal->prodID,prodID);

	char* final;
	Event* tempEvent = malloc(sizeof(Event));
	tempEvent->properties = initializeList(&printProperty, &deleteProperty, &compareProperties);
	tempEvent->alarms = initializeList(&printAlarm, &deleteAlarm, &compareAlarms);

	DateTime start,creation;
	strcpy(start.date,startDate);
	strcpy(start.time,startTime);
	start.UTC=utc;
	tempEvent->startDateTime=start;
	strcpy(creation.date,creationDate);
	strcpy(creation.time,creationTime);
	creation.UTC=utc;
	tempEvent->creationDateTime=creation;
	strcpy(tempEvent->UID,uid);
	if (summary[0]!='\0'){
		Property*tempProp=malloc(sizeof(Property)+strlen(summary));
		strcpy(tempProp->propName,"SUMMARY");
		strcpy(tempProp->propDescr,summary);
		insertBack(tempEvent->properties, (void*)tempProp);
		addEvent(tempCal,tempEvent);
	}else{
		addEvent(tempCal,tempEvent);
	}


	final = calendarToJSON(tempCal);

	writeCalendar(fileName,tempCal);
	printf("%s\n",final);
	return final;
}

char* eventToAlarmList(const Calendar* cal, int index){
	int count = 0;
	Node* ptr = cal->events->head;
	Event* currEvent;
	while(ptr != NULL){
		currEvent = (Event*)ptr->data;
		if (count==index-1){
			break;
		}
		ptr = ptr->next;
		count++;
	}
	return alarmListToJSON(currEvent->alarms);
}

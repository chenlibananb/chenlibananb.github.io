```
#include "Debug.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
typedef struct SMap Map;
typedef void (*Des)(Map *);
typedef void (*PUT)(Map *,char *,void *);
typedef void *(*GET)(Map *,char *);
struct SMap{
	char *key;
	void *value;
	struct SMap *next;
	Des destory;
	PUT put;
	GET get;
};
void destory(Map *this);
void put(Map *this,char *key,void *value);
void *get(Map *this,char *key);
Map* GMap();


void destory(Map *this){
	free((*this).key);
	free((*this).value);
	if((*this).next!=NULL){
		(*((*this).next)).destory((*this).next);
	}
	free(this);
};
void put(Map *this,char *key,void *value){
	if((*this).key==NULL){
		(*this).key=(char *)malloc((strlen(key)+1)*sizeof(char));
		strcpy((*this).key,key);
		(*this).value=value;
	}else if(strcmp((*this).key,key)==0){
		(*this).value=value;
	}else if((*this).next==NULL){
		Map *next=GMap();
		(*this).next=next;
		(*((*this).next)).put((*this).next,key,value);
	}else{
		(*((*this).next)).put((*this).next,key,value);
	}
};
void *get(Map *this,char *key){
	if((*this).key==NULL){
		return NULL;
	}else if(strcmp((*this).key,key)==0){
		return (*this).value;
	}else if((*this).next==NULL){
		return NULL;
	}else{
		return (*((*this).next)).get((*this).next,key);
	}	
};
Map* GMap(){
	Map *this;
	this=(Map *)malloc(sizeof(Map));
	this->key=NULL;
	this->value=NULL;
	this->next=NULL;
	this->destory=destory;
	this->put=put;
	this->get=get;
	return this;
};
typedef struct person Person;
struct person {
	char *name;
	int age;
};
void main(){
	if(Debug)printf("%s\n",__func__);
	char *templeate="[{'name':${zlb.name},'age':${zlb.age},{'name':${syy.name},'age':${syy.age}}]";
	Map *this=GMap();
	Person zlb={"朱亮冰-zlb",27};
	Person syy={"沈依瑜-syy",20};
	this->put(this,"zlb",&zlb);
	this->put(this,"syy",&syy);
	if(Debug)printf("%s\n",((Person *)(this->get(this,"zlb")))->name);
	if(Debug)printf("%d\n",((Person *)(this->get(this,"syy")))->age);
	
//	if(0)printf("[{'name':%s,'age':%d,{'name':%s,'age':%d}]",zlb.name,zlb.age,syy.name,syy.age);
	
}
```